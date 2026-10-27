const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const liveRoot = '/home/salih/QCare';
const folders = ['routes', 'controllers', 'models', 'utils', 'tests'];
for (const filename of ['/AGENTS.md', '/home/AGENTS.md', '/home/salih/AGENTS.md', liveRoot + '/AGENTS.md', liveRoot + '/server/AGENTS.md', ...folders.map(folder => `${liveRoot}/server/${folder}/AGENTS.md`)]) {
  if (fs.existsSync(filename)) throw new Error('Review applicable instructions before staging: ' + filename + '\n' + fs.readFileSync(filename, 'utf8'));
}
const list = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
const app = list.find(p => p.name === 'QCare');
if (!app || app.pm2_env.pm_exec_path !== liveRoot + '/server/index.js' || app.pm2_env.status !== 'online' || app.pm2_env.watch) throw new Error('Unexpected live QCare process configuration');
const files = Object.keys(payload.files);
const expected = {};
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
for (const relative of files) {
  const target = path.resolve(liveRoot, relative);
  if (!target.startsWith(liveRoot + '/server/')) throw new Error('Unexpected target: ' + relative);
  expected[relative] = fs.existsSync(target) ? sha(fs.readFileSync(target)) : null;
}
const stageRoot = '/home/salih/.cache/qcare-audit-releases/' + Date.now();
fs.mkdirSync(stageRoot, { recursive: true });
fs.cpSync(liveRoot + '/server', stageRoot + '/server', { recursive: true, filter: source => !['node_modules', 'uploads', 'private'].includes(path.basename(source)) && !path.basename(source).startsWith('.env') });
fs.symlinkSync(liveRoot + '/server/node_modules', stageRoot + '/server/node_modules', 'dir');
for (const [relative, contents] of Object.entries({ ...payload.files, ...payload.testFiles })) {
  const target = path.join(stageRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  if (target.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', target], { encoding: 'utf8' });
}
const fromStage = require('node:module').createRequire(stageRoot + '/server/package.json');
fromStage('./routes/clinicalAuditRoutes');
const tests = ['server/tests/clinicalAudit.test.js', 'server/tests/clinicalAuditPersistence.test.js'];
console.log(cp.execFileSync(process.execPath, ['--test', ...tests], { cwd: stageRoot, env: { ...process.env, QCARE_TEST_MONGOD: '/usr/local/bin/mongod' }, encoding: 'utf8', timeout: 120000, maxBuffer: 2000000 }));
const manifest = { liveRoot, stageRoot, files, expected, prepared: new Date().toISOString(), process: { name: app.name, id: app.pm_id, cwd: app.pm2_env.pm_cwd } };
fs.writeFileSync(stageRoot + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('AUDIT_PREPARED ' + JSON.stringify(manifest));
