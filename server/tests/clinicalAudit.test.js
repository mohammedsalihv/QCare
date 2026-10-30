const { test } = require('node:test');
const assert = require('node:assert/strict');
const ClinicalAudit = require('../models/ClinicalAudit');
const AuditTemplate = require('../models/AuditTemplate');
const User = require('../models/users');
const Location = require('../models/Location');
const Department = require('../models/department');
const workflow = require('../controllers/clinicalAuditWorkflow');
const { scoreFindings } = require('../utils/clinicalAuditScoring');
const routes = require('../routes/clinicalAuditRoutes');
const { normalizeAuditSchedule } = require('../utils/clinicalAuditSchedule');
const auditor = '507f1f77bcf86cd799439011';
const reviewer = '507f1f77bcf86cd799439012';
const location = '507f1f77bcf86cd799439013';
const criteria = [{ criterionId: 'A', text: 'First', weight: 3 }, { criterionId: 'B', text: 'Second', weight: 1 }];
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
function document(status = 'in-progress') {
  return new ClinicalAudit({ auditTitle: 'Clinic safety', templateId: reviewer, auditType: 'planned', governancePillar: 'clinical-audit', standard: 'internal', scheduledDate: new Date(), auditor, location, department: 'Clinic', status, criteriaSnapshot: criteria });
}
function lookup(t, audit) {
  t.mock.method(ClinicalAudit, 'findById', () => ({ populate: async () => audit }));
  if (audit) t.mock.method(audit, 'save', async () => audit);
}
const request = (id = auditor, role = 'Staff', body = {}) => ({ params: { id: reviewer }, user: { _id: id, role }, body });

test('weighted score and coverage distinguish assessed criteria from missing ones', () => {
  const scored = scoreFindings(criteria, [{ criterionId: 'A', complianceStatus: 'compliant' }, { criterionId: 'B', complianceStatus: 'non-compliant' }]);
  assert.equal(scored.overallScore, 75); assert.equal(scored.coverage, 100); assert.equal(scored.nonCompliantCount, 1);
  const partial = scoreFindings(criteria, [{ criterionId: 'A', complianceStatus: 'partial' }]);
  assert.equal(partial.overallScore, 50); assert.equal(partial.coverage, 50); assert.equal(partial.findings[1].complianceStatus, 'not-assessed');
});
test('not applicable criteria require reasons and do not reduce compliance', () => {
  assert.throws(() => scoreFindings(criteria, [{ criterionId: 'A', complianceStatus: 'not-applicable' }]), /Explain/);
  const findings = criteria.map(c => ({ criterionId: c.criterionId, complianceStatus: 'not-applicable', exclusionReason: 'Service not provided' }));
  assert.equal(scoreFindings(criteria, findings, true).overallScore, null);
  assert.equal(scoreFindings(criteria, findings, true).coverage, 100);
});
test('unknown, duplicate, invalid, and incomplete submissions are rejected', () => {
  assert.throws(() => scoreFindings(criteria, [{ criterionId: 'C', complianceStatus: 'compliant' }]), /Unknown/);
  assert.throws(() => scoreFindings(criteria, [{ criterionId: 'A', complianceStatus: 'compliant' }, { criterionId: 'A', complianceStatus: 'partial' }]), /duplicate/);
  assert.throws(() => scoreFindings(criteria, [{ criterionId: 'A', complianceStatus: 'invalid' }]), /Invalid/);
  assert.throws(() => scoreFindings(criteria, [], true), /Assess every/);
});
test('scheduling derives standard and immutable criteria from the template and ignores injected state', async t => {
  t.mock.method(Location, 'exists', async () => true);
  t.mock.method(AuditTemplate, 'findOne', async () => ({ criteria, standard: 'internal', governancePillar: 'clinical-audit' }));
  t.mock.method(User, 'exists', async () => true);
  const create = t.mock.method(ClinicalAudit, 'create', async body => body);
  const res = response();
  await workflow.scheduleAudit(request(reviewer, 'QualityManager', { auditTitle: 'Audit', templateId: reviewer, auditor, location, department: 'Clinic', scheduledDate: '2026-10-26', auditType: 'planned', status: 'completed', standard: 'JCI', overallScore: 100 }), res);
  assert.equal(res.statusCode, 201); assert.equal(res.data.standard, 'internal'); assert.equal(res.data.status, 'pending-approval');
  assert.equal(create.mock.calls[0].arguments[0].criteriaSnapshot[0].weight, 3);
});
test('only the assigned auditor and quality managers can start audits', async t => {
  const audit = document('scheduled'); lookup(t, audit);
  const denied = response(); await workflow.startAudit(request(reviewer), denied); assert.equal(denied.statusCode, 403);
  const allowed = response(); await workflow.startAudit(request(), allowed); assert.equal(audit.status, 'in-progress'); assert.equal(allowed.statusCode, 200);
});
test('completed and submitted audits cannot be edited or restarted', async t => {
  const audit = document('completed'); lookup(t, audit);
  for (const fn of [workflow.startAudit, workflow.updateFindings]) {
    const res = response(); await fn(request(auditor, 'SuperAdmin', { findings: [] }), res); assert.equal(res.statusCode, 400);
  }
});
test('submitting requires all criteria and enters review rather than closing', async t => {
  const audit = document(); lookup(t, audit);
  const incomplete = response(); await workflow.completeAudit(request(), incomplete); assert.equal(incomplete.statusCode, 400);
  audit.findings = criteria.map(c => ({ criterionId: c.criterionId, complianceStatus: 'compliant' }));
  const res = response(); await workflow.completeAudit(request(), res);
  assert.equal(res.statusCode, 200); assert.equal(audit.status, 'pending-review'); assert.equal(String(audit.submittedBy), auditor);
});
test('approval requires a different quality manager and preserves review history', async t => {
  const audit = document('pending-review'); audit.submittedBy = auditor; lookup(t, audit);
  const own = response(); await workflow.reviewAudit(request(auditor, 'QualityManager', { decision: 'approve' }), own); assert.equal(own.statusCode, 403);
  const staff = response(); await workflow.reviewAudit(request(reviewer, 'Staff', { decision: 'approve' }), staff); assert.equal(staff.statusCode, 403);
  const res = response(); await workflow.reviewAudit(request(reviewer, 'QualityManager', { decision: 'approve', comment: 'Evidence reviewed' }), res);
  assert.equal(audit.status, 'completed'); assert.equal(String(audit.reviewedBy), reviewer); assert.equal(audit.history.at(-1).event, 'approved');
});
test('returning an audit requires feedback and unlocks it', async t => {
  const audit = document('pending-review'); audit.submittedBy = auditor; lookup(t, audit);
  const empty = response(); await workflow.reviewAudit(request(reviewer, 'SuperAdmin', { decision: 'return' }), empty); assert.equal(empty.statusCode, 400);
  const res = response(); await workflow.reviewAudit(request(reviewer, 'SuperAdmin', { decision: 'return', comment: 'Add observations' }), res); assert.equal(audit.status, 'in-progress');
});
test('actions require completion evidence and independent verification', async t => {
  const audit = document();
  audit.improvementActions.push({ actionText: 'Train staff', owner: auditor, dueDate: new Date(), status: 'in-progress' });
  lookup(t, audit); const action = audit.improvementActions[0];
  const req = request(); req.params.actionId = action._id;
  req.body = { status: 'completed' }; const shortcut = response(); await workflow.updateAction(req, shortcut); assert.equal(shortcut.statusCode, 400);
  req.body = { status: 'pending-verification' }; const missing = response(); await workflow.updateAction(req, missing); assert.equal(missing.statusCode, 400);
  req.body.completionEvidence = 'Training attendance recorded'; await workflow.updateAction(req, response()); assert.equal(action.status, 'pending-verification');
  req.user.role = 'SuperAdmin'; req.body = { status: 'completed' }; const own = response(); await workflow.updateAction(req, own); assert.equal(own.statusCode, 403);
  req.user._id = reviewer; await workflow.updateAction(req, response()); assert.equal(action.status, 'completed'); assert.equal(String(action.verifiedBy), reviewer);
});
test('findings cannot introduce arbitrary attachment references', async t => {
  lookup(t, document()); const res = response();
  await workflow.updateFindings(request(auditor, 'Staff', { findings: [{ criterionId: 'A', complianceStatus: 'compliant', attachments: ['../../secret.pdf'] }] }), res);
  assert.equal(res.statusCode, 400); assert.match(res.data.message, /Upload evidence/);
});
test('evidence rejects unrelated users, unknown criteria, and invalid file signatures', async t => {
  lookup(t, document());
  const req = request(reviewer); req.params.criterionId = 'A'; req.file = { buffer: Buffer.from('not a PDF') };
  const denied = response(); await workflow.uploadEvidence(req, denied); assert.equal(denied.statusCode, 403);
  req.user._id = auditor; const invalid = response(); await workflow.uploadEvidence(req, invalid); assert.equal(invalid.statusCode, 400);
  req.params.criterionId = 'unknown'; const unknown = response(); await workflow.uploadEvidence(req, unknown); assert.equal(unknown.statusCode, 400);
});
test('review and scheduling routes keep manager role gates', () => {
  for (const path of ['/', '/:id/review', '/templates']) {
    const route = routes.stack.find(layer => layer.route?.path === path).route;
    const method = path.includes('review') ? 'put' : 'post';
    const handlers = route.stack.filter(layer => layer.method === method);
    const denied = response(); handlers[1].handle({ user: { role: 'Staff' } }, denied, () => assert.fail('Staff cannot manage audits'));
    assert.equal(denied.statusCode, 403);
  }
});

test('template edit and delete require authentication and manager privileges', () => {
  const route = routes.stack.find(layer => layer.route?.path === '/templates/:templateId').route;
  for (const method of ['put', 'delete']) {
    const handlers = route.stack.filter(layer => layer.method === method);
    assert.equal(handlers[0].handle.name, 'protect');
    const res = response();
    handlers[1].handle({ user: { role: 'Staff' } }, res, () => assert.fail('Staff cannot change templates'));
    assert.equal(res.statusCode, 403);
  }
});
test('uploaded evidence persists privately and only authorized users can download it', async t => {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const audit = document(); lookup(t, audit);
  const req = request(); req.params.criterionId = 'A';
  req.file = { buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9e8AAAAASUVORK5CYII=', 'base64') };
  const uploaded = response(); await workflow.uploadEvidence(req, uploaded);
  assert.equal(uploaded.statusCode, 201);
  const file = path.resolve(__dirname, '../private/clinical-audit', uploaded.data.id);
  t.after(() => fs.unlink(file));
  assert.deepEqual(await fs.readFile(file), req.file.buffer);
  assert(audit.findings[0].attachments.includes(uploaded.data.id));
  req.params.fileId = uploaded.data.id;
  let downloaded;
  const res = { ...response(), setHeader() {}, download(name) { downloaded = name; } };
  await workflow.downloadEvidence(req, res); assert.equal(downloaded, file);
  req.user._id = reviewer; const denied = response(); await workflow.downloadEvidence(req, denied); assert.equal(denied.statusCode, 403);
  req.user._id = auditor; req.params.fileId = '../../private.pdf'; const traversal = response(); await workflow.downloadEvidence(req, traversal); assert.equal(traversal.statusCode, 404);
});

test('an external auditor needs no user record and the name can be omitted', async t => {
  t.mock.method(Location, 'exists', async () => true);
  t.mock.method(AuditTemplate, 'findOne', async () => ({ criteria, standard: 'internal', governancePillar: 'clinical-audit' }));
  t.mock.method(User, 'exists', () => assert.fail('External auditor must not query users'));
  t.mock.method(ClinicalAudit, 'create', async body => { const audit = new ClinicalAudit(body); await audit.validate(); return audit; });
  for (const auditorName of ['External reviewer from accreditation body', '', undefined]) {
    const res = response();
    await workflow.scheduleAudit(request(reviewer, 'QualityManager', { auditTitle: 'External audit', templateId: reviewer, location, auditType: 'planned', auditorName,
      sessions: [{ startAt: '2026-11-02T09:00:00+04:00', endAt: '2026-11-02T11:00:00+04:00' }] }), res);
    assert.equal(res.statusCode, 201, res.data?.message); assert.equal(res.data.auditor, undefined);
    assert.equal(res.data.auditorName, auditorName || undefined); assert.equal(res.data.sessions.length, 1);
  }
});

test('location is mandatory and must come from active locations', async t => {
  t.mock.method(Location, 'exists', async () => null);
  const templateLookup = t.mock.method(AuditTemplate, 'findOne', () => assert.fail('Invalid location must be rejected first'));
  for (const value of [undefined, '', 'free text location', location]) {
    const res = response();
    await workflow.scheduleAudit(request(reviewer, 'QualityManager', { location: value, scheduledDate: '2026-10-26' }), res);
    assert.equal(res.statusCode, 400); assert.match(res.data.message, /location/i);
  }
  assert.equal(templateLookup.mock.calls.length, 0);
});

test('multiple optional departments and persons are validated and stored as references', async t => {
  t.mock.method(Location, 'exists', async () => true);
  t.mock.method(AuditTemplate, 'findOne', async () => ({ criteria, standard: 'ADHICS', governancePillar: 'clinical-audit' }));
  t.mock.method(Department, 'find', () => ({ select: async () => [{ _id: auditor, name: 'Nursing' }, { _id: reviewer, name: 'Quality' }] }));
  const persons = t.mock.method(User, 'countDocuments', async () => 2);
  t.mock.method(ClinicalAudit, 'create', async body => { const audit = new ClinicalAudit(body); await audit.validate(); return audit; });
  const res = response();
  await workflow.scheduleAudit(request(reviewer, 'QualityManager', { auditTitle: 'Security audit', templateId: reviewer, location, auditType: 'planned', scheduledDate: '2026-10-26', concernedDepartments: [auditor, reviewer, auditor], concernedPersons: [auditor, reviewer, reviewer] }), res);
  assert.equal(res.statusCode, 201, res.data?.message);
  assert.deepEqual(res.data.concernedDepartments.map(String), [auditor, reviewer]);
  assert.deepEqual(res.data.concernedPersons.map(String), [auditor, reviewer]);
  assert.equal(res.data.department, 'Nursing, Quality');
  assert.deepEqual(persons.mock.calls[0].arguments[0].status, { $nin: ['blocked', 'inactive'] });
});

test('forged or inactive department/person choices are rejected', async t => {
  t.mock.method(Location, 'exists', async () => true);
  t.mock.method(Department, 'find', () => ({ select: async () => [] }));
  t.mock.method(User, 'countDocuments', async () => 0);
  for (const values of [{ concernedDepartments: ['Nursing'] }, { concernedDepartments: [reviewer] }, { concernedPersons: 'all' }, { concernedPersons: [{ $ne: null }] }, { concernedPersons: [reviewer] }]) {
    const res = response();
    await workflow.scheduleAudit(request(reviewer, 'QualityManager', { location, scheduledDate: '2026-10-26', ...values }), res);
    assert.equal(res.statusCode, 400);
  }
});

test('template standards include ADHICS, Jawda, ADMCC and custom names', async t => {
  t.mock.method(AuditTemplate, 'create', async body => { const template = new AuditTemplate(body); await template.validate(); return template; });
  for (const standard of ['ADHICS', 'Jawda', 'ADMCC', 'Internal safety review']) {
    const res = response();
    await workflow.createTemplate(request(reviewer, 'QualityManager', { templateName: 'Checklist', governancePillar: 'clinical-audit', standard, criteria }), res);
    assert.equal(res.statusCode, 201, res.data?.message); assert.equal(res.data.standard, standard);
  }
  const invalid = response(); await workflow.createTemplate(request(reviewer, 'QualityManager', { standard: '   ', criteria }), invalid); assert.equal(invalid.statusCode, 400);
});

test('new audits require locations while legacy audits remain editable', async () => {
  const audit = document(); audit.location = undefined;
  await assert.rejects(() => audit.validate(), /location/);
  audit.isNew = false;
  await audit.validate();
});

test('date planner supports selected dates, ranges, shared times and customized times', async () => {
  const { buildAuditDates, initialDatePlan, datesBetween } = await import('../../client/src/components/audit/auditDatePlan.js');
  const plan = initialDatePlan(); plan.dates = datesBetween('2026-10-30', '2026-11-02');
  assert.equal(plan.dates.length, 4); assert.equal(buildAuditDates(plan).length, 4);
  plan.windows.push({ start: '14:00', end: '15:00' }); assert.equal(buildAuditDates(plan).length, 8);
  plan.mode = 'individual'; plan.dateWindows['2026-10-30'] = [{ start: '11:00', end: '12:30' }];
  const slots = buildAuditDates(plan); assert.equal(slots.length, 7); assert.equal(slots[0].startAt, '2026-10-30T11:00:00+04:00');
  assert.deepEqual(datesBetween('2026-11-02', '2026-10-30'), plan.dates);
  assert.throws(() => buildAuditDates(initialDatePlan()), /Choose at least/);
  assert.throws(() => datesBetween('2026-01-01', '2026-12-31'), /100 dates/);
  plan.windows.push({ start: '09:30', end: '10:30' }); assert.throws(() => buildAuditDates(plan), /overlap/);
});

test('multiple dates and times are sorted and preserve Dubai offsets', () => {
  const result = normalizeAuditSchedule([
    { startAt: '2026-11-03T14:00:00+04:00', endAt: '2026-11-03T15:00:00+04:00' },
    { startAt: '2026-11-02T11:00:00+04:00', endAt: '2026-11-02T12:00:00+04:00' },
    { startAt: '2026-11-02T09:00:00+04:00', endAt: '2026-11-02T11:00:00+04:00' }
  ]);
  assert.equal(result.sessions.length, 3);
  assert.equal(result.scheduledDate.toISOString(), '2026-11-02T05:00:00.000Z');
  assert.equal(result.scheduledUntil.toISOString(), '2026-11-03T11:00:00.000Z');
});

test('invalid, empty, reversed, duplicate, and overlapping sessions are rejected', () => {
  const slot = { startAt: '2026-11-02T09:00:00+04:00', endAt: '2026-11-02T11:00:00+04:00' };
  for (const sessions of [[], [null], [{ ...slot, startAt: 'bad' }], [{ ...slot, startAt: '2026-11-02T09:00:00' }], [{ ...slot, endAt: slot.startAt }], [{ ...slot, endAt: '2026-11-02T08:00:00+04:00' }], [slot, slot], [slot, { startAt: '2026-11-02T10:30:00+04:00', endAt: '2026-11-02T12:00:00+04:00' }]]) {
    assert.throws(() => normalizeAuditSchedule(sessions));
  }
  const legacy = normalizeAuditSchedule(undefined, '2026-10-26');
  assert.equal(legacy.sessions.length, 0);
  assert.equal(legacy.scheduledDate.toISOString(), '2026-10-26T00:00:00.000Z');
});
