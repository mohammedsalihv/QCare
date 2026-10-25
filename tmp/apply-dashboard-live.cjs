const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const allowedRoot = '/home/salih/QCare';
const stage = path.resolve(release.stageRoot);
if (!stage.startsWith('/home/salih/.cache/qcare-dashboard-releases/')) throw new Error('Unexpected staged release path');
const manifest = JSON.parse(fs.readFileSync(stage + '/manifest.json', 'utf8'));
if (manifest.liveRoot !== allowedRoot || manifest.process.name !== 'QCare') throw new Error('Unexpected live target');
const originals = new Map();
for (const relative of manifest.files) {
  const target = path.resolve(allowedRoot, relative);
  if (!target.startsWith(allowedRoot + '/server/')) throw new Error('Invalid live target: ' + relative);
  const current = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if ((current === null ? null : sha(current)) !== manifest.expected[relative]) throw new Error('Live file changed since staging: ' + relative);
  originals.set(relative, current);
  cp.execFileSync(process.execPath, ['--check', path.join(stage, relative)], { encoding: 'utf8' });
}
const backup = '/home/salih/QCare_deploy_backups/dashboard-' + Date.now();
fs.mkdirSync(backup, { recursive: true });
for (const [relative, contents] of originals) {
  if (contents === null) continue;
  const target = path.join(backup, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}
fs.writeFileSync(backup + '/manifest.json', JSON.stringify(manifest, null, 2));
const atomicWrite = (filename, contents) => {
  const temporary = filename + '.dashboard-release-' + process.pid;
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, filename);
};
async function healthy() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const root = await fetch('http://127.0.0.1:5000/', { signal: AbortSignal.timeout(2000) });
      const specialty = await fetch('http://127.0.0.1:5000/api/specialties', { signal: AbortSignal.timeout(2000) });
      const overview = await fetch('http://127.0.0.1:5000/api/dashboard/overview', { signal: AbortSignal.timeout(2000) });
      const users = await fetch('http://127.0.0.1:5000/api/users/directory', { signal: AbortSignal.timeout(2000) });
      if (overview.status === 401 && root.status === 200 && specialty.status === 401 && users.status === 401) return true;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  return false;
}
(async () => {
  try {
    for (const relative of manifest.files) {
      const target = path.join(allowedRoot, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      atomicWrite(target, fs.readFileSync(path.join(stage, relative)));
    }
    cp.execFileSync('pm2', ['restart', 'QCare'], { encoding: 'utf8' });
    if (!await healthy()) throw new Error('Updated API did not pass health checks');
    const list = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
    const app = list.find(item => item.name === 'QCare');
    if (app?.pm2_env.status !== 'online') throw new Error('QCare process is not online');
    console.log(JSON.stringify({ deployed: true, backup, process: app.name, status: app.pm2_env.status, routes: { dashboard: 'mounted; authentication required', specialties: 'mounted; authentication required', directory: 'mounted; authentication required' }, files: manifest.files }, null, 2));
  } catch (error) {
    for (const [relative, contents] of originals) {
      const target = path.resolve(allowedRoot, relative);
      if (!target.startsWith(allowedRoot + '/server/')) throw new Error('Invalid rollback target');
      if (contents === null) { if (fs.existsSync(target)) fs.unlinkSync(target); }
      else atomicWrite(target, contents);
    }
    cp.execFileSync('pm2', ['restart', 'QCare'], { encoding: 'utf8' });
    throw new Error('Deployment rolled back: ' + error.message + '. Backup: ' + backup);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
