const cp = require('node:child_process');
const script = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = '/home/salih/QCare';
const app = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
if (app?.pm2_env.pm_exec_path !== root + '/server/index.js') throw new Error('Unexpected QCare process');
const req = require('node:module').createRequire(root + '/server/package.json');
const mongoose = req('mongoose');
const dotenv = req('dotenv');
const envPath = path.join(app.pm2_env.pm_cwd, '.env');
const env = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const uri = app.pm2_env.MONGO_URL || env.MONGO_URL;
if (!uri) throw new Error('The live database setting was not found');
const source = fs.readFileSync(root + '/server/controllers/userController.js', 'utf8').split('\n');
const indexes = new Set();
source.forEach((line, i) => { if (/restricted|isActive|status ===|status !==/.test(line) && i < 200) for (let j = Math.max(0, i - 4); j <= Math.min(source.length - 1, i + 4); j++) indexes.add(j); });
console.log('LIVE_LOGIN_RESTRICTION_CHECKS');
for (const i of [...indexes].sort((a,b) => a-b)) console.log((i+1) + ': ' + source[i]);
(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const accounts = await mongoose.connection.collection('users').find({ $or: [{ username: /^salih$/i }, { employeeId: /^salih$/i }] }, { projection: { username: 1, employeeId: 1, role: 1, status: 1, isActive: 1, authSource: 1, updatedAt: 1, lastLogin: 1 } }).limit(10).toArray();
    console.log('ACCOUNT_STATUS ' + JSON.stringify(accounts));
  } finally { await mongoose.disconnect(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
`;
process.stdout.write(cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', 'node -'], { input: script, encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 1000000 }));
