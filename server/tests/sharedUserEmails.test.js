const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const User = require('../models/users');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const { ensureSharedUserEmails } = require('../utils/userEmailIndex');

test('migrates legacy email uniqueness and keeps shared-email accounts separate', { timeout: 120000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-shared-email-'));
  const database = spawn(process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe',
    ['--dbpath', directory, '--port', '27984', '--bind_ip', '127.0.0.1', '--quiet'],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  database.stdout.on('data', chunk => { output = (output + chunk).slice(-12000); });
  database.stderr.on('data', chunk => { output = (output + chunk).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  try {
    for (let attempt = 0; attempt < 150 && !output.includes('Waiting for connections'); attempt++) {
      if (database.exitCode !== null) throw new Error(output);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(output.includes('Waiting for connections'));
    await mongoose.connect('mongodb://127.0.0.1:27984/qcare_shared_email_test');
    await User.init();
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await ensureSharedUserEmails(User.collection);
    await ensureSharedUserEmails(User.collection); // Safe on subsequent starts.
    const fields = { employeeName: 'Employee', email: 'team@test.invalid', password: 'test-password', department: 'Quality', designation: 'Staff' };
    const first = await User.create({ ...fields, employeeId: 'ONE', username: 'ONE' });
    const second = await User.create({ ...fields, employeeId: 'TWO', username: 'TWO' });
    assert.notEqual(String(first._id), String(second._id));
    await assert.rejects(User.create({ ...fields, employeeId: 'ONE', username: 'THREE' }), error => error.code === 11000);
    await assert.rejects(User.create({ ...fields, employeeId: 'THREE', username: 'ONE' }), error => error.code === 11000);
    const originalSettings = Settings.findOne;
    const originalAudit = AuditLog.create;
    const auth = require('../utils/ldapAuth');
    const originalAuth = auth.authenticateLDAP;
    Settings.findOne = async () => ({ ldapConfigs: [{ ldapEnabled: true }] });
    AuditLog.create = async () => ({});
    auth.authenticateLDAP = async () => ({ sAMAccountName: 'TWO', email: fields.email, name: 'Second employee' });
    delete require.cache[require.resolve('../controllers/userController')];
    const { loginUser } = require('../controllers/userController');
    const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
    try {
      const ldapResponse = response();
      await loginUser({ body: { employeeId: 'TWO', password: fields.password }, headers: {} }, ldapResponse);
      assert.equal(String(ldapResponse.body._id), String(second._id));
      assert.equal((await User.findById(first._id)).employeeName, 'Employee');
      Settings.findOne = async () => null;
      const sharedResponse = response();
      await loginUser({ body: { employeeId: fields.email, password: fields.password }, headers: {} }, sharedResponse);
      assert.equal(sharedResponse.code, 400);
      assert.match(sharedResponse.body.message, /shared/);
      const idResponse = response();
      await loginUser({ body: { employeeId: 'ONE', password: fields.password }, headers: {} }, idResponse);
      assert.equal(String(idResponse.body._id), String(first._id));
    } finally {
      Settings.findOne = originalSettings;
      AuditLog.create = originalAudit;
      auth.authenticateLDAP = originalAuth;
    }
  } finally {
    await mongoose.disconnect();
    database.kill();
    await exited;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
