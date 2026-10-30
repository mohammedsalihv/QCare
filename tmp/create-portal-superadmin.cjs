const cp = require('node:child_process');

function readSecret() {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('A private terminal input is required'));
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = chunk => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') process.exit(1);
        if (character === '\r' || character === '\n') {
          process.stdin.off('data', onData); process.stdin.setRawMode(false); process.stdin.pause();
          const secret = value; value = ''; resolve(secret); return;
        }
        value += character;
      }
    };
    process.stdin.on('data', onData);
    process.stdout.write('READY_FOR_PRIVATE_PASSWORD\n');
  });
}

const remote = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = '/home/salih/QCare';
const service = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
if (service?.pm2_env.pm_exec_path !== root + '/server/index.js') throw new Error('Unexpected QCare service');
const fromServer = require('node:module').createRequire(root + '/server/package.json');
const mongoose = fromServer('mongoose');
const User = fromServer('./models/users');
const AuditLog = fromServer('./models/AuditLog');
const dotenv = fromServer('dotenv');
const envPath = path.join(service.pm2_env.pm_cwd, '.env');
const settings = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const uri = service.pm2_env.MONGO_URL || settings.MONGO_URL;
if (!uri) throw new Error('Live database setting not found');
if (!User.schema.path('role').enumValues.includes('SuperAdmin')) throw new Error('SuperAdmin role is not supported');
(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const identity = { username: 'portal.superadmin', employeeId: 'PORTAL-SUPERADMIN', email: 'portal.superadmin@qcare.local' };
    const exists = await User.exists({ $or: [{ username: identity.username }, { employeeId: identity.employeeId }, { email: identity.email }] });
    if (exists) throw new Error('This generic account already exists. No existing account or password was changed.');
    const user = await User.create({ ...identity, employeeName: 'Portal Super Administrator', password: providedPassword, role: 'SuperAdmin', department: 'Portal Administration', designation: 'Portal Super Administrator', authSource: 'local', status: 'active', isActive: true });
    const saved = await User.findById(user._id);
    if (!saved || saved.role !== 'SuperAdmin' || saved.status !== 'active' || saved.isActive !== true || !/^\$2[aby]\$/.test(saved.password) || !await saved.matchPassword(providedPassword)) throw new Error('Account was created but credential/status verification failed');
    const gates = fromServer('./middleware/authMiddleware');
    for (const gate of [gates.admin, gates.superAdmin, gates.authorize('QualityManager', 'SuperAdmin')]) {
      let allowed = false;
      gate({ user: saved }, { status() { throw new Error('SuperAdmin permission verification failed'); } }, () => { allowed = true; });
      if (!allowed) throw new Error('SuperAdmin permission verification failed');
    }
    let auditLogged = false;
    try {
      await AuditLog.create({ action: 'USER_CREATED', module: 'Main Master', pageName: 'User Management', activity: 'Created generic portal.superadmin account with SuperAdmin role at the account owner request.', performedBy: new mongoose.Types.ObjectId('6a140865da5cfc8593148ae3'), ipAddress: '127.0.0.1' });
      auditLogged = true;
    } catch { /* Report separately; do not mask a successfully created account. */ }
    console.log(JSON.stringify({ created: true, username: saved.username, employeeId: saved.employeeId, role: saved.role, status: saved.status, isActive: saved.isActive, authSource: saved.authSource, passwordHashVerified: true, permissionGatesVerified: true, auditLogged }));
  } finally { await mongoose.disconnect(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
`;

(async () => {
  let secret = await readSecret();
  if (!secret) throw new Error('Password is required');
  const output = cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', 'node -'], { input: `const providedPassword = ${JSON.stringify(secret)};\n` + remote, encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 1000000 });
  secret = '';
  process.stdout.write(output);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
