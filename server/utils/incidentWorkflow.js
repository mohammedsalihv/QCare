const mongoose = require('mongoose');
const User = require('../models/users');
const reviewer = user => ['admin', 'superadmin', 'qualitymanager'].includes(user.role?.toLowerCase());
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const participantQuery = user => reviewer(user) ? {} : { $or: [{ reportedBy: user._id }, { assignedTo: user._id }, { notifyStaff: user._id }, { primaryResponsible: user._id }, { secondaryResponsible: user._id }, { 'opinions.recipient': user._id }, { 'actions.owner': user._id }] };
const accessQuery = user => ({ $and: [{ deletedAt: null }, participantQuery(user)] });
const canRead = (row, user) => !row.deletedAt && (reviewer(user) || same(row.reportedBy, user._id) || same(row.assignedTo, user._id) || same(row.primaryResponsible, user._id) || same(row.secondaryResponsible, user._id) || (row.opinions || []).some(opinion => same(opinion.recipient, user._id)) || row.notifyStaff.some(id => same(id, user._id)) || row.actions.some(action => same(action.owner, user._id)));
const canInvestigate = (row, user) => reviewer(user) || same(row.assignedTo, user._id) || same(row.primaryResponsible, user._id);
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const text = (value, label, required = false, max = 5000) => {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${label} is required and must be under ${max} characters.`);
  return value.trim();
};
const date = (value, label) => { const input = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && label.includes('deadline') ? value + 'T23:59:59+04:00' : value; const result = new Date(input); if (!value || !Number.isFinite(result.getTime())) fail(`Choose a valid ${label}.`); return result; };
const choice = (value, options, label) => { if (!options.includes(value)) fail(`Choose a valid ${label}.`); return value; };
async function activeUser(id) {
  if (!mongoose.isValidObjectId(id) || !await User.exists({ _id: id, isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } })) fail('Choose an active staff member.');
  return id;
}
const terminal = row => ['Closed', 'Rejected', 'Duplicate'].includes(row.status);
function record(row, user, event, detail = '') {
  row.history.push({ event, detail, actor: user._id, actorName: user.employeeName || 'Staff member', at: new Date(), request: require('./requestAudit').currentMetadata() });
}

// Every write goes through a named command; arbitrary status/field patches are not accepted.
async function applyCommand(row, user, body) {
  const command = body.command;
  const manager = reviewer(user), investigator = canInvestigate(row, user);
  if (!canRead(row, user)) fail('Incident not found.', 404);
  if (body.version !== row.__v) fail('This incident changed. Reload it before saving your changes.', 409);
  if (terminal(row) && command !== 'reopen') fail('Reopen this incident before making changes.');
  const requireInvestigator = () => { if (!investigator) fail('Only the assigned investigator or a reviewer can perform this action.', 403); };
  const requireReviewer = () => { if (!manager) fail('A quality reviewer must perform this action.', 403); };
  const reason = () => text(body.reason, 'Reason', true);
  let detail = '';
  switch (command) {
    case 'accept': case 'assign':
      if (!(command === 'accept' && same(row.primaryResponsible, user._id) && same(body.assignedTo, row.assignedTo))) requireReviewer();
      if (command === 'accept' && !['Pending', 'Needs clarification', 'Reopened'].includes(row.status)) fail('This incident has already been accepted.');
      if (row.status === 'Closure review') fail('Return the incident for further work before changing its investigator.');
      row.assignedTo = await activeUser(body.assignedTo);
      if (manager && body.primaryResponsible !== undefined) row.primaryResponsible = body.primaryResponsible ? await activeUser(body.primaryResponsible) : undefined;
      if (manager && body.secondaryResponsible !== undefined) row.secondaryResponsible = body.secondaryResponsible ? await activeUser(body.secondaryResponsible) : undefined;
      if (manager) { row.routingSource = 'manual'; row.routingReason = 'Assigned by Quality reviewer'; }
      row.investigationDue = date(body.investigationDue, 'investigation deadline');
      row.riskLevel = choice(body.riskLevel, ['Low', 'Medium', 'High', 'Critical'], 'initial risk');
      if (command === 'accept' || row.status === 'Resolved') row.status = 'Accepted';
      detail = `Investigator ${row.assignedTo}; deadline ${row.investigationDue.toISOString()}; risk ${row.riskLevel}.`; break;
    case 'route': {
      requireReviewer();
      if (!['Pending', 'Needs clarification', 'Accepted', 'Reopened'].includes(row.status)) fail('Automatic routing is available before investigation begins.');
      const routing = await require('./incidentRouting').resolveRouting(row);
      if (!routing.assignedTo) fail(routing.routingReason);
      row.secondaryResponsible = undefined;
      row.primaryResponsible = undefined;
      Object.assign(row, routing); detail = routing.routingReason; break;
    }
    case 'requestOpinion':
      if (!investigator && !same(row.secondaryResponsible, user._id)) fail('Only the investigator, branch responsible person or Quality reviewer can request an opinion.', 403);
      if (row.opinions.length >= 50) fail('This incident already has 50 opinion requests.');
      row.opinions.push({ recipient: await activeUser(body.recipient), requestedBy: user._id, question: text(body.question, 'Opinion request', true) });
      detail = 'Department / manager opinion requested'; break;
    case 'respondOpinion': {
      const opinion = row.opinions.id(body.opinionId);
      if (!opinion || !same(opinion.recipient, user._id)) fail('Only the requested person can submit this opinion.', 403);
      if (opinion.respondedAt) fail('This opinion has already been submitted. Add any further clarification as a comment.');
      opinion.response = text(body.response, 'Opinion', true); opinion.respondedAt = new Date();
      detail = 'Requested opinion submitted'; break;
    }
    case 'clarify': case 'reject': case 'duplicate':
      requireReviewer();
      if (!['Pending', 'Needs clarification', 'Reopened'].includes(row.status)) fail('Triage decisions apply only before acceptance.');
      detail = reason(); row.status = { clarify: 'Needs clarification', reject: 'Rejected', duplicate: 'Duplicate' }[command]; break;
    case 'start':
      if (!manager && !same(row.assignedTo, user._id)) fail('Only the Quality investigator or reviewer can start the investigation.', 403);
      if (!['Accepted', 'Reopened', 'Resolved'].includes(row.status)) fail('Accept this incident before starting investigation.');
      if (!row.assignedTo) fail('Assign an investigator before starting investigation.');
      row.status = 'Investigating'; break;
    case 'investigate':
      requireInvestigator();
      if (!['Investigating', 'Action in progress', 'Reopened'].includes(row.status)) fail('Start the investigation before recording findings.');
      for (const key of ['findings', 'rootCause', 'contributingFactors', 'operationalImpact', 'temporaryControls', 'potentialConsequence', 'actionsTaken']) {
        if (body[key] !== undefined) row[key] = text(body[key], key);
      }
      if (body.likelihood !== undefined) row.likelihood = choice(body.likelihood, ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'], 'likelihood');
      if (body.riskLevel !== undefined) row.riskLevel = choice(body.riskLevel, ['Low', 'Medium', 'High', 'Critical'], 'risk level');
      detail = 'Investigation findings and impact assessment updated.'; break;
    case 'addAction': case 'editAction': {
      requireInvestigator();
      if (!['Investigating', 'Action in progress', 'Reopened'].includes(row.status)) fail('Start investigation before planning actions.');
      if (command === 'addAction' && row.actions.length >= 100) fail('This incident already has 100 actions.');
      const values = { title: text(body.title, 'Action', true, 500), kind: choice(body.kind, ['Correction', 'Corrective', 'Preventive'], 'action type'), owner: await activeUser(body.owner), dueDate: date(body.dueDate, 'action deadline'), successCriteria: text(body.successCriteria, 'Success criteria', true) };
      if (command === 'editAction') {
        const action = row.actions.id(body.actionId);
        if (!action || action.completedAt) fail('Only an open action can be edited.');
        Object.assign(action, values);
      } else row.actions.push(values);
      row.status = 'Investigating';
      detail = text(body.title, 'Action', true, 500); break;
    }
    case 'approvePlan':
      requireReviewer();
      if (!['Investigating', 'Reopened'].includes(row.status) || !row.findings?.trim() || !row.rootCause?.trim() || !row.actions.length) fail('Record findings, root cause and at least one action before approving the plan.');
      row.status = 'Action in progress'; detail = 'Action plan approved.'; break;
    case 'completeAction': {
      if (row.status !== 'Action in progress') fail('The action plan must be approved before completion.');
      const action = row.actions.id(body.actionId);
      if (!action) fail('Action not found.', 404);
      if (!manager && !same(action.owner, user._id)) fail('Only the action owner or reviewer can complete this action.', 403);
      if (action.completedAt) fail('This action is already completed.');
      action.completion = text(body.completion, 'Completion details and evidence', true);
      action.completedAt = new Date(); action.completedBy = user._id;
      detail = action.title; break;
    }
    case 'requestClosure':
      requireInvestigator();
      if (row.primaryResponsible && !manager && !same(row.primaryResponsible, user._id)) fail('The accountable department manager must request closure.', 403);
      if (row.opinions.some(o => !o.respondedAt)) fail('Obtain all requested opinions before requesting closure.');
      if (!['Action in progress', 'Resolved'].includes(row.status) || !row.findings?.trim() || !row.rootCause?.trim() || !row.actions.length || row.actions.some(a => !a.completedAt)) fail('Record findings and root cause, and complete all actions before requesting closure.');
      row.closureSummary = text(body.closureSummary, 'Closure summary', true);
      row.status = 'Closure review'; break;
    case 'close':
      requireReviewer();
      if (row.opinions.some(o => !o.respondedAt)) fail('Obtain all requested opinions before approving closure.');
      if (row.status !== 'Closure review') fail('Request closure review first.');
      if (same(row.primaryResponsible, user._id) || same(row.secondaryResponsible, user._id) || same(row.assignedTo, user._id) || same(row.reportedBy, user._id) || row.actions.some(a => same(a.owner, user._id) || same(a.completedBy, user._id))) fail('Closure must be approved by a reviewer independent of the responsible managers, reporter, investigator and action owners.', 403);
      if (!row.actions.length || row.actions.some(a => !a.completedAt)) fail('Complete all actions first.');
      row.effectiveness = choice(body.effectiveness, ['Effective'], 'effective review result');
      row.effectivenessEvidence = text(body.effectivenessEvidence, 'Effectiveness evidence', true);
      row.effectivenessDate = date(body.effectivenessDate, 'effectiveness review date');
      if (row.effectivenessDate > new Date()) fail('Effectiveness review cannot be in the future.');
      row.residualRisk = choice(body.residualRisk, ['Low', 'Medium', 'High', 'Critical'], 'residual risk');
      row.closedAt = new Date(); row.closedBy = user._id; row.status = 'Closed';
      detail = row.effectivenessEvidence; break;
    case 'return':
      requireReviewer();
      if (!['Closure review', 'Resolved'].includes(row.status)) fail('This incident is not awaiting closure review.');
      detail = reason(); row.effectiveness = choice(body.effectiveness, ['Partially effective', 'Ineffective'], 'review result');
      row.status = 'Investigating'; break;
    case 'reopen':
      requireReviewer();
      if (!terminal(row)) fail('Only a closed, rejected or duplicate incident can be reopened.');
      detail = reason(); row.status = 'Reopened'; row.closedAt = undefined; row.closedBy = undefined;
      row.effectiveness = ''; row.effectivenessEvidence = ''; row.effectivenessDate = undefined; row.residualRisk = ''; break;
    case 'comment':
      if (row.comments.length >= 1000) fail('Comment limit reached.');
      row.comments.push({ body: text(body.body, 'Comment', true), kind: choice(body.kind || 'Comment', ['Comment', 'Witness statement', 'Clarification'], 'comment type'), author: user._id, authorName: user.employeeName || 'Staff member' });
      detail = 'A ' + (body.kind || 'comment').toLowerCase() + ' was added.'; break;
    default: fail('Choose a supported workflow action.');
  }
  record(row, user, command, detail);
  return row;
}
module.exports = { reviewer, same, accessQuery, canRead, canInvestigate, fail, record, applyCommand };
