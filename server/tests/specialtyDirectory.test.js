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
const Department = require('../models/department');
const Specialty = require('../models/Specialty');

// An isolated local MongoDB process. Never connects to the application's database.
test('specialties persist through rereads and deletions; staff directory uses real users safely', { timeout: 120000 }, async () => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-specialty-test-'));
  const database = spawn(mongod, ['--dbpath', directory, '--port', '27982', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let databaseOutput = '';
  database.stdout.on('data', chunk => { databaseOutput = (databaseOutput + chunk).slice(-12000); });
  database.stderr.on('data', chunk => { databaseOutput = (databaseOutput + chunk).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  let server;
  try {
    // Wait for this newly spawned process, not a pre-existing server on the port.
    for (let attempt = 0; attempt < 150 && !databaseOutput.includes('Waiting for connections'); attempt++) {
      if (database.exitCode !== null) throw new Error('Isolated MongoDB failed to start: ' + databaseOutput);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(databaseOutput.includes('Waiting for connections'), 'Isolated MongoDB must be ready');
    await mongoose.connect('mongodb://127.0.0.1:27982/qcare_specialty_test', { serverSelectionTimeoutMS: 5000 });
    await Specialty.init();
    const admin = await User.create({ employeeId: 'TEST-ADMIN', employeeName: 'Test Admin', email: 'admin@test.invalid', password: 'test-password-only', role: 'admin', department: 'Quality', designation: 'Administrator' });
    const staff = await User.create({ employeeId: 'TEST-DOCTOR', employeeName: 'Test Doctor', email: 'doctor@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Physician' });
    const inactive = await User.create({ employeeId: 'TEST-INACTIVE', employeeName: 'Inactive Staff', email: 'inactive@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Nurse', status: 'inactive' });
    const department = await Department.create({ name: 'Medicine', code: 'TEST-MED' });
    const app = express(); app.use(express.json());
    app.use('/api/users', require('../routes/userRoutes'));
    app.use('/api/specialties', require('../routes/specialtyRoutes'));
    app.use('/api/departments', require('../routes/departmentRoutes'));
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    const token = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret');
    const request = async (url, user = admin, method = 'GET', body) => {
      const res = await fetch(base + url, { method, headers: { ...(user ? { Authorization: 'Bearer ' + token(user) } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: res.status, body: await res.json() };
    };
    assert.equal((await request('/api/users/directory', null)).status, 401);
    assert.equal((await request('/api/users', staff)).status, 403);
    const directoryResult = await request('/api/users/directory', staff);
    assert.equal(directoryResult.status, 200);
    assert.equal(directoryResult.body.length, 2);
    assert(directoryResult.body.some(user => user.employeeName === 'Test Doctor'));
    for (const user of directoryResult.body) {
      assert(!('password' in user)); assert(!('email' in user)); assert(!('confirmPassword' in user)); assert(!('role' in user));
    }
    assert.equal((await request('/api/users/directory', inactive)).status, 403);
    const payload = { name: ' Cardiology ', department: String(department._id), head: String(staff._id), status: 'Active' };
    assert.equal((await request('/api/specialties', staff, 'POST', payload)).status, 403);
    const created = await request('/api/specialties', admin, 'POST', payload);
    assert.equal(created.status, 201); assert.equal(created.body.name, 'Cardiology');
    assert.equal(created.body.head.employeeName, 'Test Doctor');
    const specialtyId = created.body._id;
    assert(await Specialty.findById(specialtyId), 'Create must write to MongoDB');
    const reread = await request('/api/specialties', staff);
    assert.equal(reread.body.length, 1); assert.equal(reread.body[0].department.name, 'Medicine');
    assert.equal((await request('/api/specialties', admin, 'POST', { ...payload, name: 'CARDIOLOGY' })).status, 409);
    assert.equal((await request('/api/specialties', admin, 'POST', { ...payload, name: 'Bad lead', head: String(inactive._id) })).status, 400);
    assert.equal((await request('/api/specialties', admin, 'POST', { ...payload, name: 'Bad department', department: '507f1f77bcf86cd799439099' })).status, 400);
    const edited = await request('/api/specialties/' + specialtyId, admin, 'PUT', { name: 'Cardiology clinic', status: 'Inactive', head: '' });
    assert.equal(edited.status, 200);
    const stored = await Specialty.findById(specialtyId); assert.equal(stored.name, 'Cardiology clinic'); assert.equal(stored.status, 'Inactive'); assert.equal(stored.head, null);
    assert.equal((await request('/api/specialties/' + specialtyId, staff, 'DELETE')).status, 403);
    assert.equal((await request('/api/specialties/' + specialtyId, admin, 'DELETE')).status, 200);
    assert.equal(await Specialty.findById(specialtyId), null, 'Delete must remove the MongoDB document');
    assert.deepEqual((await request('/api/specialties', admin)).body, [], 'A fresh GET must stay empty after deletion');
    assert.equal((await request('/api/specialties/' + specialtyId, admin, 'DELETE')).status, 404);
    if (process.env.QCARE_BROWSER_TEST === '1') await require('./helpers/specialtyBrowser.cjs')({ base, admin, staff, token, Specialty });
    console.log('Verified real MongoDB create, reread, edit, status change, deletion, duplicate validation and staff-directory permissions.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    database.kill(); await exited;
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
    assert(path.basename(resolved).startsWith('qcare-specialty-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
