const governanceReport = require('./governanceReport');
const { presentation, eventLabel } = require('./incidentReportPresentation');
const date = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
const person = value => value?.employeeName || 'Not recorded';
const field = (caption, text) => ({ caption, text: text || 'Not recorded' });

module.exports = function incidentPdf(row, options = {}) {
  const info = presentation(row, options.generatedAt || new Date());
  const missing = [['Department', 'department'], ['Area / room', 'areaRoom'], ['Witness information', 'witnesses'], ['Immediate actions', 'immediateActions']].filter(([, key]) => !row[key]?.trim()).map(([label]) => label);
  const investigationRecorded = ['assignedTo', 'investigationDue', 'likelihood', 'potentialConsequence', 'operationalImpact', 'temporaryControls', 'findings', 'rootCause', 'contributingFactors', 'actionsTaken'].some(key => row[key]);
  const closureRecorded = ['closureSummary', 'effectiveness', 'residualRisk', 'effectivenessEvidence', 'effectivenessDate', 'closedBy', 'closedAt'].some(key => row[key]);
  return governanceReport({
    title: row.title, reference: row.incidentId, reportLabel: 'INCIDENT REPORT',
    status: info.label, statusColor: info.color,
    approvalText: row.status === 'Closed' ? 'Approved closure' : 'Current saved incident record',
    ...options,
    metrics: [[row.riskLevel || 'Not assessed', 'Assessed risk'], [row.harmLevel || 'Unknown', 'Harm level'], [String((row.actions || []).filter(a => !a.completedAt).length), 'Open actions']],
    render: ({ table }) => {
      table('01', 'Current position & next action', [], [.5, .5], [
        [{ caption: 'Unique incident ID - use this to search in QCare', text: row.incidentId, bold: true }],
        [field('Saved status', info.label), field('Last updated (Dubai)', date(row.updatedAt || row.createdAt))],
        [field('Workflow stage', info.stage), field('Action completion', `${info.completed} of ${info.total} complete`)],
        [field('What this status means', info.meaning)],
        [field('Next action / responsible role', info.next)],
        [field('Next deadline (Dubai)', info.nextDue ? `${info.nextDue.kind}: ${date(info.nextDue.date)}` : 'No open deadline recorded'), field('Overdue work', info.overdue ? `${info.overdue} overdue deadline(s)` : 'No overdue deadlines')],
        [field('Report information not supplied', missing.length ? missing.join(', ') + '. These details were not saved with this report; they have not been inferred.' : 'Department, area, witness information and immediate actions are recorded.')]
      ]);
      table('02', 'Incident overview', [], [.5, .5], [
        [field('Branch', row.location), field('Department', row.department)],
        [field('Area / room', row.areaRoom), field('Category', row.category)],
        [field('Incident date (Dubai)', date(row.dateOfIncident)), field('Reported (Dubai)', date(row.createdAt))],
        [field('Reported by', person(row.reportedBy)), field('Initial severity', row.severity)],
        [field('Description', row.description)], [field('Immediate actions', row.immediateActions)],
        [field('Involved staff', (row.involvedStaff || []).map(person).join(', ')), field('Notified staff', (row.notifyStaff || []).map(person).join(', '))],
        [field('Additional staff notification requested', row.notifyChoice || (row.notifyStaff?.length ? 'Yes - recipients recorded' : 'Not recorded in this older report'))],
        [field('Witnesses', row.witnesses)]
      ]);
      table('03', 'Investigation & risk assessment', [], [.5, .5], investigationRecorded ? [
        [field('Investigator', person(row.assignedTo)), field('Investigation deadline', date(row.investigationDue))],
        [field('Likelihood', row.likelihood), field('Potential consequence', row.potentialConsequence)],
        ...[['Operational impact', 'operationalImpact'], ['Temporary controls', 'temporaryControls'], ['Findings', 'findings'], ['Root cause', 'rootCause'], ['Contributing factors', 'contributingFactors'], ['Actions already taken', 'actionsTaken']].map(([label, key]) => [field(label, row[key])])
      ] : [[field('Not yet recorded', 'Investigation has not been entered. A reviewer must assign an investigator and deadline. Findings, root cause and at least one action are required before the action plan can be approved.')]]);
      table('04', 'Corrective & preventive actions', ['Action / success criteria', 'Owner / due date', 'Completion / evidence'], [.43, .25, .32], row.actions?.length ? row.actions.map((a, i) => [
        `${i + 1}. ${a.kind}: ${a.title}\n\nSuccess criteria: ${a.successCriteria}`,
        `${person(a.owner)}\n\nDue: ${date(a.dueDate)}`,
        a.completedAt ? `Completed: ${date(a.completedAt)}\nBy: ${person(a.completedBy)}\n\n${a.completion || 'Not recorded'}` : 'Open - completion pending'
      ]) : [[field('No actions planned', 'An action must state what will be done, its type, owner, deadline and success criteria. Completion evidence is recorded after plan approval.')]]);
      table('05', 'Closure & effectiveness', [], [.5, .5], closureRecorded ? [
        [field('Approval position', row.status === 'Closed' ? 'Independent closure approved.' : ['Rejected', 'Duplicate'].includes(row.status) ? 'Review decision recorded; see activity history.' : 'Closure is not yet approved.')],
        [field('Closure summary', row.closureSummary)],
        [field('Effectiveness result', row.effectiveness), field('Residual risk', row.residualRisk)],
        [field('Effectiveness evidence', row.effectivenessEvidence)],
        [field('Review date', date(row.effectivenessDate)), field('Approved by', person(row.closedBy))],
        [field('Closed', date(row.closedAt))]
      ] : [[field('Not yet recorded', 'No closure review is recorded. Complete the investigation and actions, then submit a closure summary. An independent reviewer records effectiveness evidence, review date and residual risk before approving closure.')]]);
      table('06', 'Comments & statements', ['Date / author', 'Type', 'Statement'], [.28, .22, .5], (row.comments || []).map(c => [`${date(c.at)}\n${c.authorName}`, c.kind, c.body]));
      table('07', 'Supporting evidence', ['Attachment', 'Size / availability'], [.6, .4], (row.attachments || []).map(a => [a.name, `${a.size} bytes\nDownload separately in QCare`]));
      table('08', 'Activity record', ['Date & time (Dubai)', 'Activity / detail', 'Recorded by'], [.27, .43, .3], (row.history || []).map(h => [date(h.at), `${eventLabel(h.event)}\n${h.detail || ''}`, h.actorName || 'Not recorded']));
    }
  });
};
