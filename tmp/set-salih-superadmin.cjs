const cp = require('node:child_process');
const script = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = '/home/salih/QCare';
const app = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
if (app?.pm2_env.pm_exec_path !== root + '/server/index.js') throw new Error('Unexpected QCare process');
const fromServer = require('node:module').createRequire(root + '/server/package.json');
const mongoose = fromServer('mongoose');
const dotenv = fromServer('dotenv');
const User = fromServer('./models/users');
if (!User.schema.path('role').enumValues.includes('SuperAdmin')) throw new Error('SuperAdmin is not a supported role');
const envPath = path.join(app.pm2_env.pm_cwd, '.env');
const settings = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const uri = app.pm2_env.MONGO_URL || settings.MONGO_URL;
if (!uri) throw new Error('Live database setting not found');
(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const users = mongoose.connection.collection('users');
    const id = new mongoose.Types.ObjectId('6a140865da5cfc8593148ae3');
    const before = await users.findOne({ _id: id, employeeId: 'salih' }, { projection: { employeeId: 1, role: 1, status: 1, isActive: 1 } });
    if (!before) throw new Error('The verified salih account was not found; no changes made');
    const result = await users.updateOne({ _id: id, employeeId: 'salih', role: before.role }, { $set: { role: 'SuperAdmin', updatedAt: new Date() } });
    if (result.matchedCount !== 1) throw new Error('Account changed during the update; verify its role');
    const after = await users.findOne({ _id: id }, { projection: { employeeId: 1, role: 1, status: 1, isActive: 1 } });
    if (after.role !== 'SuperAdmin') throw new Error('Role update verification failed');
    console.log(JSON.stringify({ employeeId: after.employeeId, role: after.role, status: after.status, isActive: after.isActive, activationUnchanged: after.status === before.status && after.isActive === before.isActive }));
  } finally { await mongoose.disconnect(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
`;
process.stdout.write(cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', 'node -'], { input: script, encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 1000000 }));
