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
test('location and designation lists paginate, filter and sort with bounded authorized queries', { timeout: 120000 }, async () => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-master-list-test-'));
  const database = spawn(mongod, ['--dbpath', directory, '--port', '27983', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
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
    await mongoose.connect('mongodb://127.0.0.1:27983/qcare_master_list_test', { serverSelectionTimeoutMS: 5000 });
    await Specialty.init();
    const admin = await User.create({ employeeId: 'TEST-ADMIN', employeeName: 'Test Admin', email: 'admin@test.invalid', password: 'test-password-only', role: 'admin', department: 'Quality', designation: 'Administrator' });
    const staff = await User.create({ employeeId: 'TEST-DOCTOR', employeeName: 'Test Doctor', email: 'doctor@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Physician' });
    const inactive = await User.create({ employeeId: 'TEST-INACTIVE', employeeName: 'Inactive Staff', email: 'inactive@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Nurse', status: 'inactive' });
    const department = await Department.create({ name: 'Medicine', code: 'TEST-MED' });
    const app = express(); app.use(express.json());
    app.use('/api/locations', require('../routes/locationRoutes'));
    app.use('/api/designations', require('../routes/designationRoutes'));
    app.use('/api/specialties', require('../routes/specialtyRoutes'));
    app.use('/api/departments', require('../routes/departmentRoutes'));
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    const token = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret');
    const request = async (url, user = admin, method = 'GET', body) => {
      const res = await fetch(base + url, { method, headers: { ...(user ? { Authorization: 'Bearer ' + token(user) } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: res.status, body: await res.json() };
    };
    for (const [route, model, rows] of [
      ['locations', require('../models/Location'), Array.from({ length: 12 }, (_, i) => ({ name: 'Location ' + String(i).padStart(2, '0'), code: 'LOC' + i, isActive: i < 10 }))],
      ['designations', require('../models/Designation'), Array.from({ length: 12 }, (_, i) => ({ title: 'Role ' + String(i).padStart(2, '0'), code: 'ROLE' + i, grade: 'G1', description: 'Test role', status: i < 10 ? 'Active' : 'Inactive' }))]
    ]) {
      await model.insertMany(rows);
      assert.equal((await request('/api/' + route + '?page=1', null)).status, 401);
      const first = await request('/api/' + route + '?page=1&limit=5&sortBy=name', staff);
      const second = await request('/api/' + route + '?page=2&limit=5&sortBy=name', staff);
      assert.equal(first.status, 200); assert.equal(first.body.total, 12); assert.equal(first.body.items.length, 5);
      assert(!second.body.items.some(row => first.body.items.some(other => row._id === other._id)));
      assert.equal((await request('/api/' + route + '?page=1&status=Inactive', staff)).body.total, 2);
      assert.equal((await request('/api/' + route + '?page=99&limit=5', staff)).body.page, 3);
      assert.equal((await request('/api/' + route + '?page=1&search=02', staff)).body.total, 1);
      assert.equal((await request('/api/' + route + '?page=1&search=.*', staff)).body.total, 0);
      const desc = await request('/api/' + route + '?page=1&direction=desc', staff);
      assert.equal(desc.body.items[0].name || desc.body.items[0].title, route === 'locations' ? 'Location 11' : 'Role 11');
      for (const q of ['limit=101', 'sortBy=password', 'direction=bad', 'status=bad']) assert.equal((await request('/api/' + route + '?page=1&' + q, staff)).status, 400);
      assert.equal((await request('/api/' + route, staff)).body.length, 12, 'Legacy selector contract remains compatible');
      assert.equal((await request('/api/' + route, staff, 'POST', rows[0])).status, 403);
      await model.deleteMany({});
      const empty = await request('/api/' + route + '?page=2', staff);
      assert.equal(empty.body.page, 1); assert.equal(empty.body.total, 0); assert.deepEqual(empty.body.items, []);
    }
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    database.kill(); await exited;
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
    assert(path.basename(resolved).startsWith('qcare-master-list-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
