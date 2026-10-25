const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const liveRoot = '/home/salih/QCare';
const stageRoot = '/home/salih/.cache/qcare-dashboard-releases/' + Date.now() + '-' + process.pid;
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const read = relative => fs.readFileSync(path.join(liveRoot, relative), 'utf8');
const files = { ...payload.files };
const testPath = 'server/tests/dashboardOverview.test.js';
delete files[testPath];
for (const folder of ['routes', 'controllers', 'models', 'middleware', 'tests']) {
  const instructions = path.join(liveRoot, 'server', folder, 'AGENTS.md');
  if (fs.existsSync(instructions)) throw new Error('Review additional instructions before deployment: ' + instructions);
}
const processes = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
const app = processes.find(item => item.name === 'QCare');
if (!app || app.pm2_env.pm_exec_path !== liveRoot + '/server/index.js' || app.pm2_env.status !== 'online') throw new Error('Unexpected live QCare process');
if (app.pm2_env.watch) throw new Error('Live process watches source files; a controlled stop is needed before deployment.');
function insertOnce(source, marker, addition, exists) {
  if (source.includes(exists)) return source;
  if (!source.includes(marker)) throw new Error('Source marker not found: ' + marker);
  return source.replace(marker, marker + addition);
}
files['server/index.js'] = insertOnce(read('server/index.js'), 'app.use("/api/users", userRoutes);', '\napp.use("/api/dashboard", require("./routes/dashboardRoutes"));', 'app.use("/api/dashboard"');
const expected = {};
for (const relative of Object.keys(files)) {
  const full = path.resolve(liveRoot, relative);
  if (!full.startsWith(liveRoot + '/server/')) throw new Error('Unexpected deployment target');
  expected[relative] = fs.existsSync(full) ? sha(fs.readFileSync(full)) : null;
}
fs.mkdirSync(stageRoot, { recursive: true });
fs.cpSync(liveRoot + '/server', stageRoot + '/server', { recursive: true, filter: source => !['node_modules', 'uploads'].includes(path.basename(source)) && !path.basename(source).startsWith('.env') });
fs.symlinkSync(liveRoot + '/server/node_modules', stageRoot + '/server/node_modules', 'dir');
for (const [relative, source] of Object.entries(files)) {
  const filename = path.join(stageRoot, relative);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, source);
  cp.execFileSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
}
fs.mkdirSync(path.dirname(path.join(stageRoot, testPath)), { recursive: true });
fs.writeFileSync(path.join(stageRoot, testPath), payload.files[testPath]);
const requireStage = require('node:module').createRequire(stageRoot + '/server/package.json');
requireStage('./routes/dashboardRoutes');
console.log(cp.execFileSync(process.execPath, ['--test', testPath.replace('server/', '')], { cwd: stageRoot + '/server', env: { ...process.env, QCARE_TEST_MONGOD: '/usr/local/bin/mongod', QCARE_BROWSER_TEST: '0' }, encoding: 'utf8', timeout: 90000 }));
const manifest = { liveRoot, stageRoot, files: Object.keys(files), expected, createdAt: new Date().toISOString(), process: { name: app.name, id: app.pm_id, cwd: app.pm2_env.pm_cwd } };
fs.writeFileSync(stageRoot + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('DASHBOARD_PREPARED ' + JSON.stringify({ stageRoot, files: manifest.files, process: manifest.process }));
