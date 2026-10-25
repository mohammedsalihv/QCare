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
const KPIIndicator = require('../models/KPIIndicator');
const Equipment = require('../models/EquipmentAsset');

test('dashboard counts real records, protects user data, and distinguishes missing sources from zero', { timeout: 60000 }, async t => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-dashboard-test-'));
  const database = spawn(mongod, ['--dbpath', directory, '--port', '27983', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; let server;
  database.stdout.on('data', chunk => { output = (output + chunk).slice(-12000); });
  database.stderr.on('data', chunk => { output = (output + chunk).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  try {
    for (let attempt = 0; attempt < 150 && !output.includes('Waiting for connections'); attempt++) {
      if (database.exitCode !== null) throw new Error('Temporary MongoDB did not start: ' + output);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(output.includes('Waiting for connections'));
    await mongoose.connect('mongodb://127.0.0.1:27983/qcare_dashboard_test', { serverSelectionTimeoutMS: 5000 });
    const staffId = new mongoose.Types.ObjectId();
    await User.collection.insertMany([
      { _id: staffId, employeeId: 'DASH-1', employeeName: 'Private Person A', email: 'secret-a@test.invalid', password: 'never-return-this', role: 'Staff', department: ' Quality ', designation: 'Nurse', isActive: true, status: 'active' },
      { employeeId: 'DASH-2', employeeName: 'Private Person B', department: 'quality', role: 'Staff' },
      { employeeId: 'DASH-3', employeeName: 'Private Person C', department: 'Medicine', isActive: false, status: 'inactive' },
      { employeeId: 'DASH-4', employeeName: 'Private Person D', department: '', isActive: true, status: 'blocked' },
    ]);
    const departmentId = new mongoose.Types.ObjectId();
    await Department.collection.insertMany([{ _id: departmentId, name: 'Quality', code: 'QUAL' }, { name: 'Medicine', code: 'MED', isActive: false }]);
    await Specialty.collection.insertOne({ name: 'Cardiology', nameKey: 'cardiology', department: departmentId, createdBy: staffId });
    await KPIIndicator.collection.insertMany([{ indicatorCode: 'ONE', reportingPeriod: 'Q1', reportingYear: 2026 }, { indicatorCode: 'ONE', reportingPeriod: 'Q2', reportingYear: 2026 }, { indicatorCode: 'TWO', reportingPeriod: 'Q1', reportingYear: 2026 }]);
    const app = express(); app.use('/api/dashboard', require('../routes/dashboardRoutes'));
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = 'http://127.0.0.1:' + server.address().port + '/api/dashboard/overview';
    assert.equal((await fetch(base)).status, 401);
    const headers = { Authorization: 'Bearer ' + jwt.sign({ id: staffId }, process.env.JWT_SECRET || 'default_secret') };
    let response = await fetch(base, { headers }); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    let overview = await response.json();
    assert.equal(overview.counts.users, 4); assert.equal(overview.counts.departments, 2); assert.equal(overview.counts.specialties, 1); assert.equal(overview.counts.locations, 0);
    assert.equal(overview.counts.indicators, 2); assert.equal(overview.counts.indicatorReports, 3); assert.equal(overview.counts.equipment, 0); assert.deepEqual(overview.unavailable, []);
    assert.deepEqual(overview.users.statuses, [{ name: 'Active', count: 2 }, { name: 'Inactive', count: 1 }, { name: 'Blocked', count: 1 }]);
    assert.equal(overview.users.byDepartment.find(row => row.name.toLowerCase() === 'quality').count, 2);
    assert.equal(overview.users.byDepartment.find(row => row.name === 'Unassigned').count, 1);
    assert.equal(overview.users.byDepartment.reduce((sum, row) => sum + row.count, 0), 4);
    const serialized = JSON.stringify(overview); assert(!serialized.includes('Private Person')); assert(!serialized.includes('never-return-this')); assert(!serialized.includes('secret-a')); assert(!serialized.includes('DASH-1'));
    await Department.collection.insertOne({ name: 'Operations', code: 'OPS' });
    overview = await (await fetch(base, { headers })).json(); assert.equal(overview.counts.departments, 3, 'Fresh requests must reflect new records');
    const failingSource = t.mock.method(Equipment, 'countDocuments', () => { throw new Error('Simulated collection error'); });
    overview = await (await fetch(base, { headers })).json(); assert.equal(overview.counts.equipment, null); assert(overview.unavailable.includes('equipment')); assert.equal(overview.counts.users, 4); assert.equal(overview.counts.departments, 3); failingSource.mock.restore();
    console.log('Verified organization/module totals, distinct indicators, user-status and department charts, read-only staff access, privacy, fresh counts and isolated source failure.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect(); database.kill(); await exited;
    const resolved = path.resolve(directory); assert.equal(path.dirname(resolved).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase()); assert(path.basename(resolved).startsWith('qcare-dashboard-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
