const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Master = require('../models/ClinicalMaster');
const id = '507f1f77bcf86cd799439011';
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }

test('all application dropdowns use shared Select', () => {
  const root = path.resolve(__dirname, '../../client/src');
  const violations = files(root).filter(file => /\.jsx$/.test(file) && path.relative(root, file) !== path.join('components', 'Select.jsx') && /<select\b/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(violations, []);
});
test('master-backed forms have no self-only person fallback', async () => {
  const { recordForms } = await import('../../client/src/components/records/recordForms.js');
  for (const form of Object.values(recordForms)) for (const field of form.fields) {
    if (['staffId', 'auditor'].includes(field.name)) assert.equal(field.source, '/api/users/directory');
    if (field.name === 'department') assert.equal(field.source, '/api/departments');
    if (field.name === 'specialty') assert.equal(field.source, '/api/masters/specialties');
    assert.equal(field.self, undefined);
  }
});
test('reading logs never auto-creates demo users or master records', () => {
  const source = fs.readFileSync(path.join(__dirname, '../controllers/settingsController.js'), 'utf8');
  assert.doesNotMatch(source, /seedDemoDataIfEmpty|User\.create|Designation\.insertMany/);
});

async function serverFor(t, role = 'Staff') {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: id, role }) }));
  const app = express(); app.use(express.json());
  app.use('/users', require('../routes/userRoutes'));
  app.use('/masters', require('../routes/masterRoutes'));
  app.use('/cp', require('../routes/cpRoutes'));
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const token = jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret');
  return (url, options = {}) => fetch(`http://127.0.0.1:${server.address().port}${url}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } });
}

test('authenticated staff can read main user directory with a safe field projection', async t => {
  const request = await serverFor(t);
  let projection;
  t.mock.method(User, 'find', query => {
    assert.deepEqual(query, {});
    return { select(fields) { projection = fields; return { sort: async () => [{ _id: id, employeeName: 'Test employee' }] }; } };
  });
  const result = await request('/users/directory');
  assert.equal(result.status, 200);
  assert.equal((await result.json())[0].employeeName, 'Test employee');
  assert.equal(projection, '_id employeeId employeeName department designation status isActive');
  assert.doesNotMatch(projection, /password|email|token|authSource/);
});
test('directory access does not grant account or master administration', async t => {
  const request = await serverFor(t);
  assert.equal((await request('/users')).status, 403);
  assert.equal((await request('/masters/specialties', { method: 'POST', body: JSON.stringify({ name: 'Test' }) })).status, 403);
});
test('master creation rejects independent physician identities', async t => {
  const request = await serverFor(t, 'QualityManager');
  const result = await request('/masters/physician-profiles', { method: 'POST', body: JSON.stringify({ name: 'Unregistered person' }) });
  assert.equal(result.status, 400);
  assert.match((await result.json()).message, /User Master/);
});
test('unknown master resources are rejected', async t => {
  const request = await serverFor(t, 'QualityManager');
  assert.equal((await request('/masters/passwords')).status, 404);
});
test('master lists populate people from User records instead of copied names', async t => {
  const request = await serverFor(t);
  const populations = [];
  const query = { sort() { return this; }, populate(field) { populations.push(field); return this; }, then(resolve) { return Promise.resolve([{ staffId: { _id: id, employeeName: 'Current master name' } }]).then(resolve); } };
  t.mock.method(Master, 'find', filters => { assert.equal(filters.kind, 'physician-profiles'); return query; });
  const result = await request('/masters/physician-profiles');
  assert.equal(result.status, 200);
  assert.equal((await result.json())[0].staffId.employeeName, 'Current master name');
  assert.ok(populations.includes('staffId'));
});


test('the shared credential register only exposes a staff member own records', async t => {
  const request = await serverFor(t);
  const Credential = require('../models/CredentialingRecord');
  t.mock.method(Credential, 'find', query => {
    assert.deepEqual(query, { staffId: id });
    return { populate(field) { assert.equal(field, 'staffId'); return { sort: async () => [] }; } };
  });
  const result = await request('/cp/credentials');
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), []);
});

test('specialty creation requires a department from its main master', async t => {
  const request = await serverFor(t, 'QualityManager');
  const Department = require('../models/department');
  t.mock.method(Department, 'exists', async () => null);
  const result = await request('/masters/specialties', { method: 'POST', body: JSON.stringify({ name: 'Test', code: 'T', department: 'Invented', head: id }) });
  assert.equal(result.status, 400);
  assert.match((await result.json()).message, /Department Master/);
});
