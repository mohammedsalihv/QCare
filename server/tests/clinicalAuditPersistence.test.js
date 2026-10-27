const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Location = require('../models/Location');
const Department = require('../models/department');
const Template = require('../models/AuditTemplate');
const Audit = require('../models/ClinicalAudit');

test('the actual form payload persists through real HTTP routes and MongoDB', { timeout: 120000 }, async () => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-audit-test-'));
  const port = await new Promise(resolve => { const listener = net.createServer(); listener.listen(0, '127.0.0.1', () => { const selected = listener.address().port; listener.close(() => resolve(selected)); }); });
  const database = spawn(mongod, ['--dbpath', temp, '--port', String(port), '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', spawnError, server;
  database.stdout.on('data', b => { output = (output + b).slice(-20000); });
  database.stderr.on('data', b => { output = (output + b).slice(-20000); });
  database.on('error', error => { spawnError = error; });
  const exited = new Promise(resolve => database.once('exit', resolve));
  try {
    for (let i = 0; i < 200 && !output.includes('Waiting for connections'); i++) {
      if (spawnError) throw spawnError;
      if (database.exitCode !== null) throw new Error('Isolated MongoDB failed: ' + output);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(output.includes('Waiting for connections'), 'The isolated database must be ready');
    await mongoose.connect(`mongodb://127.0.0.1:${port}/qcare_audit_test`, { serverSelectionTimeoutMS: 5000 });
    const makeUser = (suffix, role) => User.create({ employeeId: `AUDIT-${suffix}`, employeeName: `Audit ${suffix}`, email: `${suffix}@test.invalid`, password: 'isolated-test-only', role, department: 'Quality', designation: 'Quality officer' });
    const manager = await makeUser('manager', 'QualityManager'), reviewer = await makeUser('reviewer', 'QualityManager'), staff = await makeUser('staff', 'Staff');
    const location = await Location.create({ name: 'Test clinic', code: 'TEST-CLINIC' });
    const department = await Department.create({ name: 'Test nursing', code: 'TEST-NUR' });
    const template = await Template.create({ templateName: 'Test Jawda', standard: 'Jawda', governancePillar: 'clinical-audit', criteria: [{ criterionId: 'C1', text: 'Consent documentation', weight: 1 }] });
    const app = express(); app.use(express.json()); app.use('/api/audit', require('../routes/clinicalAuditRoutes'));
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = async (route, method = 'GET', body, user = manager) => {
      const response = await fetch(base + '/api/audit' + route, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret')}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, workflow: response.headers.get('x-qcare-audit-workflow'), body: await response.json() };
    };
    const payload = { auditTitle: 'CMCDL Jawda', templateId: String(template._id), auditType: 'planned', location: String(location._id), auditorName: '', concernedDepartments: [], concernedPersons: [], sessions: [21, 22, 23, 24].map(day => ({ startAt: `2026-11-${day}T09:00:00+04:00`, endAt: `2026-11-${day}T10:00:00+04:00` })) };
    const anonymous = await request('/dashboard', 'GET', undefined, null);
    assert.equal(anonymous.status, 401); assert.equal(anonymous.workflow, '3');
    assert.equal((await request('', 'POST', payload, staff)).status, 403);
    assert.equal((await request('', 'POST', { ...payload, location: '' })).status, 400);
    const created = await request('', 'POST', payload);
    assert.equal(created.status, 201, JSON.stringify(created.body)); assert.equal(created.workflow, '3');
    assert.equal(created.body.standard, 'Jawda'); assert.equal(created.body.governancePillar, 'clinical-audit');
    assert.equal(created.body.auditor, undefined); assert.deepEqual(created.body.concernedDepartments, []);
    assert.equal(created.body.sessions.length, 4); assert.equal(created.body.scheduledDate, '2026-11-21T05:00:00.000Z');
    let stored = await Audit.findById(created.body._id);
    assert(stored); assert.equal(stored.sessions.length, 4); assert.equal(String(stored.location), String(location._id));
    const read = await request('/' + created.body._id);
    assert.equal(read.body.location.name, 'Test clinic'); assert.equal(read.body.templateId.standard, 'Jawda');
    const selected = await request('', 'POST', { ...payload, auditTitle: 'Concerned teams audit', concernedDepartments: [String(department._id)], concernedPersons: [String(staff._id), String(reviewer._id)] });
    assert.equal(selected.status, 201, JSON.stringify(selected.body));
    const selectedRead = await request('/' + selected.body._id);
    assert.equal(selectedRead.body.concernedDepartments[0].name, 'Test nursing'); assert.equal(selectedRead.body.concernedPersons.length, 2);
    assert(!('password' in selectedRead.body.concernedPersons[0]));
    const id = created.body._id;
    assert.equal((await request('/' + id + '/start', 'PUT', {})).status, 200);
    assert.equal((await request('/' + id + '/findings', 'PUT', { findings: [{ criterionId: 'C1', complianceStatus: 'compliant', evidence: 'Evidence reviewed', attachments: [] }] })).status, 200);
    assert.equal((await request('/' + id + '/complete', 'PUT', {})).body.status, 'pending-review');
    assert.equal((await request('/' + id + '/review', 'PUT', { decision: 'approve' })).status, 403);
    assert.equal((await request('/' + id + '/review', 'PUT', { decision: 'approve' }, reviewer)).body.status, 'completed');
    stored = await Audit.findById(id); assert.equal(stored.status, 'completed'); assert.equal(stored.overallScore, 100);
    assert.equal((await request('')).body.length, 2);
    console.log('Verified the screenshot payload saves with no auditor or departments; four date/time windows, location, derived template fields, concerned people, reloads, and independent review persist in an isolated MongoDB.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    database.kill(); if (!spawnError) await exited;
    const target = path.resolve(temp);
    assert.equal(path.dirname(target).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
    assert(path.basename(target).startsWith('qcare-audit-test-'));
    await fs.rm(target, { recursive: true, force: true });
  }
});
