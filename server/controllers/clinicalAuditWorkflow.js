const ClinicalAudit = require('../models/ClinicalAudit');
const AuditTemplate = require('../models/AuditTemplate');
const User = require('../models/users');
const Location = require('../models/Location');
const Department = require('../models/department');
const { isValidObjectId } = require('mongoose');
const { scoreFindings } = require('../utils/clinicalAuditScoring');
const { normalizeAuditSchedule } = require('../utils/clinicalAuditSchedule');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const isManager = user => ['qualitymanager', 'superadmin'].includes(user.role?.toLowerCase());
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const canEdit = (user, audit) => isManager(user) || same(audit.auditor, user._id);
const record = (audit, req, event, detail = '') => audit.history.push({ event, actor: req.user._id, detail });
const wrap = fn => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    if (error.name === 'VersionError') return res.status(409).json({ message: 'This audit changed in another session. Reopen it before saving again.' });
    res.status(error.status || 400).json({ message: error.message });
  }
};
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
async function load(req) {
  const audit = await ClinicalAudit.findById(req.params.id).populate([
    { path: 'templateId' }, { path: 'location', select: 'name code' },
    { path: 'concernedDepartments', select: 'name' }, { path: 'concernedPersons', select: 'employeeName employeeId' }
  ]);
  if (!audit) fail('Audit not found', 404);
  return audit;
}
function criteria(audit) { return audit.criteriaSnapshot?.length ? audit.criteriaSnapshot : audit.templateId?.criteria || []; }
function editable(req, audit) {
  if (!canEdit(req.user, audit)) fail('Only the assigned auditor or quality manager can edit this audit.', 403);
  if (['pending-review', 'completed'].includes(audit.status)) fail('This audit is locked. A reviewer must return it before findings can change.');
}
async function validOwner(id) {
  if (!await User.exists({ _id: id, isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } })) fail('Select an active staff member.');
}
exports.scheduleAudit = wrap(async (req, res) => {
  const { auditTitle, templateId, auditType, scheduledDate, auditor, auditorName, department, frequency, sessions, location, concernedDepartments = [], concernedPersons = [] } = req.body;
  const schedule = normalizeAuditSchedule(sessions, scheduledDate);
  if (!location || !isValidObjectId(location)) fail('Select an audit location from the location list.');
  if (!await Location.exists({ _id: location, isActive: { $ne: false } })) fail('Select an active audit location.');
  const selectedIds = (values, label) => {
    if (!Array.isArray(values) || values.length > 100 || values.some(id => typeof id !== 'string' || !isValidObjectId(id))) fail(`Select valid ${label} from the list.`);
    return [...new Set(values)];
  };
  const departmentIds = selectedIds(concernedDepartments, 'departments'), personIds = selectedIds(concernedPersons, 'persons');
  const departments = departmentIds.length ? await Department.find({ _id: { $in: departmentIds }, isActive: { $ne: false } }).select('_id name') : [];
  if (departments.length !== departmentIds.length) fail('One or more selected departments are inactive or no longer exist.');
  if (personIds.length && await User.countDocuments({ _id: { $in: personIds }, isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } }) !== personIds.length) fail('One or more selected persons are inactive or no longer exist.');
  if (auditorName != null && (typeof auditorName !== 'string' || auditorName.trim().length > 200)) fail('Auditor name must be text up to 200 characters.');
  const template = await AuditTemplate.findOne({ _id: templateId, isActive: true });
  if (!template?.criteria?.length) fail('Choose an active template with criteria.');
  const ids = template.criteria.map(c => c.criterionId);
  if (new Set(ids).size !== ids.length) fail('The template contains duplicate criterion IDs.');
  // Preserve optional internal assignments for older clients; external auditors need no user record.
  if (auditor) await validOwner(auditor);
  const audit = await ClinicalAudit.create({ auditTitle, templateId, auditType, ...schedule, auditor: auditor || undefined, auditorName: auditorName?.trim() || undefined,
    location, concernedDepartments: departmentIds, concernedPersons: personIds,
    department: departments.length ? departments.map(d => d.name).join(', ') : (typeof department === 'string' ? department.trim() : ''), frequency: frequency || undefined,
    governancePillar: template.governancePillar, standard: template.standard,
    criteriaSnapshot: template.criteria.map(c => ({ criterionId: c.criterionId, text: c.text, text_ar: c.text_ar, weight: c.weight })),
    history: [{ event: 'scheduled', actor: req.user._id }] });
  res.status(201).json(audit);
});
exports.startAudit = wrap(async (req, res) => {
  const audit = await load(req); editable(req, audit);
  let snapshotAdded = false;
  if (!audit.criteriaSnapshot?.length) {
    audit.criteriaSnapshot = criteria(audit).map(c => ({ criterionId: c.criterionId, text: c.text, text_ar: c.text_ar, weight: c.weight }));
    snapshotAdded = true;
  }
  if (audit.status !== 'in-progress') {
    audit.status = 'in-progress'; audit.conductedDate ||= new Date(); record(audit, req, 'started'); await audit.save();
  } else if (snapshotAdded) await audit.save();
  res.json(audit);
});
exports.createTemplate = wrap(async (req, res) => {
  const { templateName, governancePillar, standard, criteria: items } = req.body;
  if (typeof standard !== 'string' || !standard.trim() || standard.trim().length > 100) fail('Choose a standard or enter its name (up to 100 characters).');
  if (!Array.isArray(items) || !items.length || items.length > 200) fail('Provide between 1 and 200 checklist criteria.');
  if (new Set(items.map(c => c.criterionId)).size !== items.length) fail('Criterion IDs must be unique.');
  const template = await AuditTemplate.create({ templateName, governancePillar, standard: standard.trim(),
    criteria: items.map(c => ({ criterionId: c.criterionId, text: c.text, text_ar: c.text_ar, weight: c.weight })), createdBy: req.user._id });
  res.status(201).json(template);
});
exports.updateFindings = wrap(async (req, res) => {
  const audit = await load(req); editable(req, audit);
  if (audit.status !== 'in-progress') fail('Start the audit before entering findings.');
  const existing = new Map(audit.findings.map(f => [f.criterionId, new Set(f.attachments)]));
  if (!Array.isArray(req.body.findings)) fail('Findings must be a list.');
  for (const f of req.body.findings) {
    if (f.attachments && (!Array.isArray(f.attachments) || f.attachments.some(id => !existing.get(f.criterionId)?.has(id)))) fail('Upload evidence before attaching it.');
  }
  Object.assign(audit, scoreFindings(criteria(audit), req.body.findings));
  record(audit, req, 'findings-saved'); await audit.save(); res.json(audit);
});
exports.completeAudit = wrap(async (req, res) => {
  const audit = await load(req); editable(req, audit);
  if (audit.status !== 'in-progress') fail('Only an audit in progress can be submitted.');
  Object.assign(audit, scoreFindings(criteria(audit), audit.findings, true));
  audit.status = 'pending-review'; audit.submittedBy = req.user._id; audit.submittedAt = new Date();
  record(audit, req, 'submitted'); await audit.save(); res.json(audit);
});
exports.reviewAudit = wrap(async (req, res) => {
  const audit = await load(req);
  if (!isManager(req.user)) fail('Quality manager approval is required.', 403);
  if (audit.status !== 'pending-review') fail('This audit is not awaiting review.');
  if (same(audit.submittedBy, req.user._id) || same(audit.auditor, req.user._id)) fail('A different quality manager must review this audit.', 403);
  const { decision, comment } = req.body;
  if (!['approve', 'return'].includes(decision)) fail('Choose approve or return.');
  if (decision === 'return' && !comment?.trim()) fail('Explain the changes required.');
  audit.reviewComment = comment?.trim() || ''; audit.reviewedBy = req.user._id; audit.reviewedAt = new Date();
  audit.status = decision === 'approve' ? 'completed' : 'in-progress';
  record(audit, req, decision === 'approve' ? 'approved' : 'returned', audit.reviewComment);
  await audit.save(); res.json(audit);
});
exports.addAction = wrap(async (req, res) => {
  const audit = await load(req);
  if (!canEdit(req.user, audit)) fail('Only the auditor or quality manager can assign actions.', 403);
  const { actionText, owner, dueDate, priority, criterionId, rootCause } = req.body;
  await validOwner(owner);
  if (criterionId && !criteria(audit).some(c => c.criterionId === criterionId)) fail('Unknown criterion.');
  audit.improvementActions.push({ actionText, owner, dueDate, priority, criterionId, rootCause });
  record(audit, req, 'action-created', actionText); await audit.save(); res.status(201).json(audit);
});
exports.updateAction = wrap(async (req, res) => {
  const audit = await load(req), action = audit.improvementActions.id(req.params.actionId);
  if (!action) fail('Action not found', 404);
  if (!canEdit(req.user, audit) && !same(action.owner, req.user._id)) fail('You cannot update this action.', 403);
  const { status, completionEvidence } = req.body;
  const next = { open: ['in-progress'], 'in-progress': ['pending-verification'], 'pending-verification': ['completed', 'in-progress'], completed: [] };
  if (!next[action.status]?.includes(status)) fail('Invalid action transition.');
  if (status === 'pending-verification') {
    if (!completionEvidence?.trim()) fail('Provide evidence of completion.');
    action.completionEvidence = completionEvidence.trim();
  }
  if (action.status === 'pending-verification') {
    if (!isManager(req.user) || same(action.owner, req.user._id)) fail('A quality manager other than the action owner must verify this action.', 403);
    if (status === 'completed') { action.verifiedBy = req.user._id; action.verifiedAt = new Date(); }
  }
  action.status = status; record(audit, req, 'action-updated', `${action._id}: ${status}`); await audit.save(); res.json(audit);
});
// Keep clinical evidence outside the public uploads directory.
const evidenceDir = path.join(__dirname, '../private/clinical-audit');
exports.uploadEvidence = wrap(async (req, res) => {
  const audit = await load(req); editable(req, audit);
  if (audit.status !== 'in-progress') fail('Start the audit first.');
  if (!criteria(audit).some(c => c.criterionId === req.params.criterionId)) fail('Unknown criterion.');
  const file = req.file;
  if (!file) fail('Choose a PDF, PNG, or JPEG file.');
  const b = file.buffer;
  const ext = b.subarray(0, 5).toString() === '%PDF-' ? 'pdf' : b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : b[0] === 255 && b[1] === 216 && b[2] === 255 ? 'jpg' : null;
  if (!ext) fail('Only PDF, PNG, and JPEG evidence is supported.');
  const id = `${randomUUID()}.${ext}`;
  await fs.mkdir(evidenceDir, { recursive: true }); await fs.writeFile(path.join(evidenceDir, id), b);
  try {
    let finding = audit.findings.find(f => f.criterionId === req.params.criterionId);
    if (!finding) { audit.findings.push({ criterionId: req.params.criterionId }); finding = audit.findings[audit.findings.length - 1]; }
    finding.attachments.push(id); record(audit, req, 'evidence-uploaded', `${req.params.criterionId}: ${id}`); await audit.save();
  } catch (error) { await fs.unlink(path.join(evidenceDir, id)).catch(() => {}); throw error; }
  res.status(201).json({ id });
});
exports.downloadEvidence = wrap(async (req, res) => {
  const audit = await load(req);
  if (!canEdit(req.user, audit) && !audit.improvementActions.some(a => same(a.owner, req.user._id))) fail('You cannot access this evidence.', 403);
  const id = req.params.fileId;
  if (!/^[a-f0-9-]+\.(pdf|png|jpg)$/.test(id) || !audit.findings.some(f => f.attachments.includes(id))) fail('Evidence not found', 404);
  const file = path.join(evidenceDir, id); await fs.access(file);
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.download(file, id);
});
