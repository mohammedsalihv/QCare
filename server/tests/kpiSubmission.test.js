const { test } = require('node:test');
const assert = require('node:assert/strict');
const KPIIndicator = require('../models/KPIIndicator');
const { submitData, approveIndicator, validateIndicator } = require('../controllers/kpiController');
const routes = require('../routes/kpiRoutes');

const staffId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const body = { indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026, numerator: 4, denominator: 100 };
const definition = { indicatorCode: 'PS-1', indicatorName: 'Safety measure', category: 'patient-safety', target: 95 };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
function stubLookup(t, record) {
  let calls = 0;
  t.mock.method(KPIIndicator, 'findOne', () => ++calls === 1 ? { sort: async () => definition } : Promise.resolve(record));
}

test('submission requires authentication but has no manager role gate', () => {
  const route = routes.stack.find(layer => layer.route?.path === '/submit-data').route;
  assert.equal(route.stack.length, 2);
  assert.equal(route.stack[0].handle.name, 'protect');
});

test('setup and approval remain restricted, with admin included', () => {
  for (const path of ['/', '/:id/validate', '/:id/approve']) {
    const route = routes.stack.find(layer => layer.route?.path === path).route;
    const handlers = route.stack.filter(layer => layer.method === 'post');
    assert.equal(handlers.length, 3);
    const gate = handlers[1].handle;
    const denied = response();
    gate({ user: { role: 'Staff' } }, denied, () => assert.fail('Staff must not manage or approve'));
    assert.equal(denied.statusCode, 403);
    let allowed = false;
    gate({ user: { role: 'admin' } }, response(), () => { allowed = true; });
    assert(allowed);
  }
});

test('staff can submit a new period without changing the indicator definition', async t => {
  stubLookup(t, null);
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const res = response();
  await submitData({ body: { ...body, target: 0, validationStatus: 'Approved' }, user: { _id: staffId, role: 'Staff' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(String(res.data.submittedBy), staffId);
  assert.equal(res.data.target, 95);
  assert.equal(res.data.validationStatus, 'Pending Validation');
  assert.equal(res.data.numerator, 4);
});

test('invalid values are rejected before database access', async t => {
  const lookup = t.mock.method(KPIIndicator, 'findOne', () => { throw new Error('Unexpected database call'); });
  for (const values of [{ numerator: -1 }, { numerator: '' }, { numerator: '4abc' }, { denominator: 0 }, { denominator: -1 }, { denominator: null }, { reportingYear: 'bad' }, { reportingPeriod: 'unknown' }]) {
    const res = response();
    await submitData({ body: { ...body, ...values }, user: { _id: staffId, role: 'Staff' } }, res);
    assert.equal(res.statusCode, 400, JSON.stringify(values));
  }
  assert.equal(lookup.mock.calls.length, 0);
});

test('staff can submit against an unsubmitted draft definition', async t => {
  const record = { ...definition, validationStatus: 'Draft', createdBy: otherId, save: async function() { return this; } };
  stubLookup(t, record);
  const res = response();
  await submitData({ body, user: { _id: staffId, role: 'user' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(record.submittedBy, staffId);
  assert.equal(record.validationStatus, 'Pending Validation');
});

test('staff cannot overwrite a colleague submission', async t => {
  stubLookup(t, { validationStatus: 'Pending Validation', submittedBy: otherId });
  const res = response();
  await submitData({ body, user: { _id: staffId, role: 'Staff' } }, res);
  assert.equal(res.statusCode, 403);
});

test('staff can correct their own pending report', async t => {
  const record = { validationStatus: 'Pending Validation', submittedBy: staffId, save: async function() { return this; } };
  stubLookup(t, record);
  const res = response();
  await submitData({ body, user: { _id: staffId, role: 'Staff' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(record.denominator, 100);
});

test('approved reports cannot be overwritten even by administrators', async t => {
  stubLookup(t, { validationStatus: 'Approved' });
  const res = response();
  await submitData({ body, user: { _id: staffId, role: 'admin' } }, res);
  assert.equal(res.statusCode, 409);
});

test('approval requires validation first', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => ({ validationStatus: 'Draft' }));
  const res = response();
  await approveIndicator({ params: { id: staffId }, user: { _id: staffId } }, res);
  assert.equal(res.statusCode, 409);
});

test('finalized reports cannot be returned through validation', async t => {
  t.mock.method(KPIIndicator, 'findById', async () => ({ validationStatus: 'Approved' }));
  const res = response();
  await validateIndicator({ params: { id: staffId }, body: { action: 'reject' }, user: { _id: staffId } }, res);
  assert.equal(res.statusCode, 409);
});
