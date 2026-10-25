const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assessMeasurement } = require('../utils/kpiMeasurement');
const KPIIndicator = require('../models/KPIIndicator');
const { createIndicator, updateIndicator, submitData, validateIndicator, saveImprovementAction, submitToDOH } = require('../controllers/kpiController');
const routes = require('../routes/kpiRoutes');
const id = '507f1f77bcf86cd799439011';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
const definition = { indicatorCode: 'QUALITY-1', indicatorName: 'Test measure', category: 'efficiency', target: 5, reportingPeriod: 'Q4', reportingYear: 2026, calculationRule: { multiplier: 1, targetDirection: 'lower', warningTolerance: 1 } };

test('measurement respects direction, units, zero target and warning tolerance', () => {
  const measure = (numerator, target, rule) => assessMeasurement({ numerator, denominator: 100, target, calculationRule: rule });
  assert.equal(measure(96, 95, {}).status, 'on-track');
  assert.equal(measure(94, 95, { warningTolerance: 2 }).status, 'at-risk');
  assert.equal(measure(92, 95, { warningTolerance: 2 }).status, 'breached');
  assert.equal(measure(4, 5, { targetDirection: 'lower' }).status, 'on-track');
  assert.equal(measure(6, 5, { targetDirection: 'lower', warningTolerance: 0 }).status, 'breached');
  assert.equal(measure(0, 0, { targetDirection: 'lower' }).status, 'on-track');
  assert.equal(measure(1, 0, { targetDirection: 'lower', warningTolerance: 0 }).status, 'breached');
  assert.equal(measure(200, 2, { multiplier: 1 }).calculatedValue, 2);
});
test('missing denominator and target never become successful performance', () => {
  assert.equal(assessMeasurement({ numerator: 0, denominator: 0, target: 0 }).status, 'not-assessed');
  assert.equal(assessMeasurement({ numerator: 1, denominator: 2, target: null }).status, 'not-assessed');
});
test('rounding does not turn a missed target into a pass', () => {
  const result = assessMeasurement({ numerator: 94999, denominator: 100000, target: 95, calculationRule: { warningTolerance: 0 } });
  assert.equal(result.calculatedValue, 95); assert.equal(result.status, 'breached');
});
test('new definitions cannot self-approve or set derived results', async t => {
  t.mock.method(KPIIndicator, 'findOne', async () => null);
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const res = response();
  await createIndicator({ body: { ...definition, validationStatus: 'Approved', submittedToDOH: true, calculatedValue: 999 }, user: { _id: id } }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.data.validationStatus, 'Draft'); assert.equal(res.data.submittedToDOH, false); assert.notEqual(res.data.calculatedValue, 999);
});
test('duplicate definitions are rejected across reporting periods', async t => {
  t.mock.method(KPIIndicator, 'findOne', async () => definition);
  const res = response(); await createIndicator({ body: definition, user: { _id: id } }, res); assert.equal(res.statusCode, 409);
});
test('generic edits cannot bypass approval locks', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => ({ validationStatus: 'Approved' }));
  const res = response(); await updateIndicator({ params: { id }, body: { numerator: 999 }, user: { _id: id } }, res); assert.equal(res.statusCode, 409);
});
test('new period retains manual calculation rules and source metadata', async t => {
  let calls = 0;
  t.mock.method(KPIIndicator, 'findOne', () => ++calls === 1 ? { sort: async () => ({ ...definition, dataSource: 'Department register' }) } : Promise.resolve(null));
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const res = response();
  await submitData({ body: { indicatorCode: definition.indicatorCode, reportingPeriod: 'Q4', reportingYear: 2026, numerator: 12, denominator: 3 }, user: { _id: id, role: 'Staff' } }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.data.calculationRule.targetDirection, 'lower'); assert.equal(res.data.calculationRule.multiplier, 1); assert.equal(res.data.dataSource, 'Department register');
});
test('returning a report requires feedback', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => ({ validationStatus: 'Pending Validation' }));
  const res = response(); await validateIndicator({ params: { id }, body: { action: 'reject', rejectionReason: '  ' }, user: { _id: id } }, res); assert.equal(res.statusCode, 400);
});
test('action dates and completion evidence are validated before database access', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => assert.fail('No database access expected'));
  const base = { title: 'Review causes', owner: 'Quality team', dueDate: '2026-11-01', status: 'Open' };
  for (const changes of [{ dueDate: '2026-02-30' }, { title: ' ' }, { status: 'Completed', notes: '' }, { status: 'Unknown' }]) {
    const res = response(); await saveImprovementAction({ params: { id }, body: { ...base, ...changes }, user: { _id: id } }, res); assert.equal(res.statusCode, 400);
  }
});
test('action creation saves responsibility and due date without altering approval', async t => {
  const report = new KPIIndicator({ ...definition, createdBy: id, validationStatus: 'Approved' });
  t.mock.method(KPIIndicator, 'findById', async () => report);
  t.mock.method(report, 'save', async function() { return this; });
  const res = response(); await saveImprovementAction({ params: { id }, body: { title: 'Review causes', owner: 'Quality team', dueDate: '2026-11-01' }, user: { _id: id } }, res);
  assert.equal(res.statusCode, 201); assert.equal(report.improvementActions.length, 1); assert.equal(report.validationStatus, 'Approved'); assert.equal(String(report.improvementActions[0].createdBy), id);
});
test('staff cannot create or update improvement actions', () => {
  for (const path of ['/:id/actions', '/:id/actions/:actionId']) {
    const route = routes.stack.find(layer => layer.route?.path === path).route;
    const res = response(); route.stack[1].handle({ user: { role: 'Staff' } }, res, () => assert.fail('Staff must not manage actions')); assert.equal(res.statusCode, 403);
  }
});
test('external submission marker requires an approved report', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => ({ validationStatus: 'Draft' }));
  const res = response(); await submitToDOH({ params: { id }, user: { _id: id } }, res); assert.equal(res.statusCode, 409);
});

test('completing and reopening actions records the outcome and completion date', async t => {
  const report = new KPIIndicator({ ...definition, createdBy: id, validationStatus: 'Approved', improvementActions: [{ title: 'Review causes', owner: 'Quality team', dueDate: '2026-11-01' }] });
  t.mock.method(KPIIndicator, 'findById', async () => report);
  t.mock.method(report, 'save', async function() { return this; });
  const action = report.improvementActions[0];
  const request = { params: { id, actionId: String(action._id) }, user: { _id: id }, body: { title: action.title, owner: action.owner, dueDate: action.dueDate, status: 'Completed', notes: 'Reviewed the next audit; process corrected.' } };
  const completed = response(); await saveImprovementAction(request, completed);
  assert.equal(completed.statusCode, 200); assert(action.completedAt); assert.equal(action.status, 'Completed');
  const reopened = response(); await saveImprovementAction({ ...request, body: { ...request.body, status: 'In progress' } }, reopened);
  assert.equal(reopened.statusCode, 200); assert.equal(action.completedAt, undefined);
});
test('action-only persistence leaves approved measurement snapshots untouched', async t => {
  const report = KPIIndicator.hydrate({ ...definition, _id: id, createdBy: id, validationStatus: 'Approved', numerator: 12, denominator: 3, calculatedValue: 99, variance: 94, status: 'breached', improvementActions: [] });
  t.mock.method(KPIIndicator.collection, 'updateOne', async () => ({ acknowledged: true, matchedCount: 1 }));
  report.improvementActions.push({ title: 'Check archived result', owner: 'Quality team', dueDate: '2026-11-01' });
  await report.save({ validateModifiedOnly: true });
  assert.equal(report.calculatedValue, 99); assert.equal(report.variance, 94); assert.equal(report.status, 'breached');
});
