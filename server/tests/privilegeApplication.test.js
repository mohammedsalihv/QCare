const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const { applicationData } = require('../utils/privilegeApplication');
const payload = { specialty: 'Test specialty', applicationType: 'new', privilegeType: 'core', reason: 'Test training and service need', requestedStartDate: '2027-01-01', expiryDate: '2028-01-01', procedures: [{ name: 'Test procedure', level: 'direct-supervision', approved: true }] };
test('application validation rejects invalid dates, duplicates and disguised files', () => {
  assert.equal(applicationData(payload).procedures[0].approved, false);
  for (const change of [{ reason: '' }, { expiryDate: '2026-01-01' }, { requestedStartDate: '2027-02-30' }, { procedures: [] }, { procedures: [payload.procedures[0], payload.procedures[0]] }]) assert.throws(() => applicationData({ ...payload, ...change }));
  assert.throws(() => applicationData(payload, [{ originalname: 'bad.pdf', mimetype: 'application/pdf', size: 12, buffer: Buffer.from('<html>bad') }]));
});
test('applications persist scope, evidence and reviewer; enforce ownership and independent approval', { timeout: 60000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-privilege-test-'));
  const database = spawn(process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe', ['--dbpath', directory, '--port', '27987', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', server;
  database.stdout.on('data', b => { output = (output + b).slice(-12000); });
  database.stderr.on('data', b => { output = (output + b).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  try {
    for (let i = 0; i < 150 && !output.includes('Waiting for connections'); i++) { if (database.exitCode !== null) throw Error(output); await new Promise(r => setTimeout(r, 100)); }
    assert(output.includes('Waiting for connections')); await mongoose.connect('mongodb://127.0.0.1:27987/qcare_privilege_test');
    const make = (name, role = 'user') => User.create({ employeeId: name, employeeName: name, email: name + '@test.invalid', password: 'test-only', role, department: 'Test', designation: 'Test' });
    const applicant = await make('applicant'), outsider = await make('outsider'), reviewer = await make('reviewer', 'QualityManager'), other = await make('other-reviewer', 'QualityManager');
    const headers = user => ({ Authorization: 'Bearer ' + jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret') });
    const app = express(); app.use(express.json()); app.use('/api/cp', require('../routes/cpRoutes'));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const base = 'http://127.0.0.1:' + server.address().port + '/api/cp/privileges';
    const body = { ...payload, staffId: String(applicant._id), assignedApprover: String(reviewer._id), status: 'approved', approvedBy: reviewer._id };
    const post = (actor, data) => fetch(base, { method: 'POST', headers: { ...headers(actor), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    assert.equal((await post(outsider, body)).status, 403);
    assert.equal((await post(applicant, { ...body, assignedApprover: outsider._id })).status, 400);
    assert.equal((await post(reviewer, { ...body, staffId: reviewer._id })).status, 400);
    const form = new FormData(); form.append('payload', JSON.stringify(body)); form.append('documents', new Blob(['%PDF-1.4\ntest evidence'], { type: 'application/pdf' }), 'evidence.pdf');
    const response = await fetch(base, { method: 'POST', headers: headers(applicant), body: form });
    const row = await response.json(); assert.equal(response.status, 201, JSON.stringify(row)); assert.equal(row.reason, payload.reason); assert.equal(row.status, 'pending-approval'); assert.equal(row.procedures[0].approved, false); assert.equal(row.approvedBy, undefined); assert.equal(row.supportingDocuments[0].data, undefined);
    const documentUrl = base + '/' + row._id + '/documents/' + row.supportingDocuments[0]._id;
    assert.equal((await fetch(documentUrl, { headers: headers(outsider) })).status, 404);
    assert.equal(await (await fetch(documentUrl, { headers: headers(reviewer) })).text(), '%PDF-1.4\ntest evidence');
    const mine = await (await fetch(base + '/mine', { headers: headers(applicant) })).json(); assert.equal(mine.length, 1); assert.equal(mine[0].supportingDocuments[0].data, undefined);
    assert.equal((await fetch(base + '/staff/' + applicant._id, { headers: headers(outsider) })).status, 403);
    const approve = actor => fetch(base + '/' + row._id + '/approve', { method: 'PUT', headers: { ...headers(actor), 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'approve' }) });
    assert.equal((await approve(other)).status, 403);
    await User.updateOne({ _id: applicant._id }, { role: 'QualityManager' });
    assert.equal((await approve(applicant)).status, 403);
    const result = await approve(reviewer); assert.equal(result.status, 200); assert.equal((await result.json()).procedures[0].approved, true);
    assert.equal((await approve(reviewer)).status, 409);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); database.kill(); await exited;
    if (path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(directory).startsWith('qcare-privilege-test-')) await fs.rm(directory, { recursive: true, force: true });
  }
});
