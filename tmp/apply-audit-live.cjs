const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = '/home/salih/QCare';
const stage = path.resolve(release.stageRoot);
if (!stage.startsWith('/home/salih/.cache/qcare-audit-releases/')) throw new Error('Unexpected staged release');
const manifest = JSON.parse(fs.readFileSync(stage + '/manifest.json', 'utf8'));
const allowed = new Set(['server/routes/clinicalAuditRoutes.js', 'server/controllers/clinicalAuditController.js', 'server/controllers/clinicalAuditWorkflow.js', 'server/models/ClinicalAudit.js', 'server/models/AuditTemplate.js', 'server/utils/clinicalAuditScoring.js', 'server/utils/clinicalAuditSchedule.js', "server/utils/clinicalAuditReport.js", "server/assets/clinical-audit/cmc-logo.jpg", "server/assets/clinical-audit/DejaVuSans.ttf", "server/assets/clinical-audit/DejaVuSans-Bold.ttf", "server/assets/clinical-audit/FONT-LICENSE.txt", "server/models/Notification.js", "server/controllers/notificationController.js", "server/utils/clinicalAuditNotifications.js", "server/utils/notificationVisibility.js", "server/utils/seedClinicalAuditTemplates.js", "server/data/clinicalAuditStarterTemplates.js"]);
if (manifest.liveRoot !== root || manifest.process.name !== 'QCare' || manifest.files.length !== allowed.size || manifest.files.some(f => !allowed.has(f))) throw new Error('Unexpected deployment targets');
const processes = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
const app = processes.find(p => p.name === 'QCare');
if (!app || app.pm2_env.pm_exec_path !== root + '/server/index.js' || app.pm2_env.status !== 'online' || app.pm2_env.watch) throw new Error('Live service changed since staging');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const originals = new Map();
for (const relative of manifest.files) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + '/server/')) throw new Error('Target outside the backend');
  const current = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if ((current ? hash(current) : null) !== manifest.expected[relative]) throw new Error('Live file changed since staging: ' + relative);
  originals.set(relative, current);
  if (relative.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', path.join(stage, relative)], { encoding: 'utf8' });
}
const backup = '/home/salih/QCare_deploy_backups/audit-' + Date.now();
fs.mkdirSync(backup, { recursive: true });
for (const [relative, data] of originals) {
  if (data === null) continue;
  const filename = path.join(backup, relative); fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, data);
}
fs.writeFileSync(backup + '/manifest.json', JSON.stringify(manifest, null, 2));
const write = (filename, data) => { const temporary = filename + '.audit-release-' + process.pid; fs.writeFileSync(temporary, data); fs.renameSync(temporary, filename); };
async function healthy() {
  for (let i = 0; i < 30; i++) {
    try {
      const rootResponse = await fetch('http://127.0.0.1:5000/', { signal: AbortSignal.timeout(2000) });
      const auditResponse = await fetch('http://127.0.0.1:5000/api/audit/dashboard', { signal: AbortSignal.timeout(2000) });
      const staffResponse = await fetch('http://127.0.0.1:5000/api/users/directory', { signal: AbortSignal.timeout(2000) });
      if (rootResponse.status === 200 && auditResponse.status === 401 && auditResponse.headers.get('x-qcare-audit-workflow') === '10' && staffResponse.status === 401) return true;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  return false;
}
(async () => {
  try {
    for (const relative of manifest.files) { const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); write(target, fs.readFileSync(path.join(stage, relative))); }
    cp.execFileSync('pm2', ['restart', 'QCare'], { encoding: 'utf8' });
    if (!await healthy()) throw new Error('Updated audit API did not pass health checks');
    const current = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
    if (current?.pm2_env.status !== 'online') throw new Error('API process is not online');
    console.log(JSON.stringify({ deployed: true, backup, process: 'QCare', status: current.pm2_env.status, workflow: '10', files: manifest.files, health: 'API healthy; audit and staff endpoints still require authentication' }, null, 2));
  } catch (error) {
    for (const [relative, contents] of originals) {
      const target = path.resolve(root, relative);
      if (!target.startsWith(root + '/server/')) throw new Error('Invalid rollback target');
      if (contents === null) { if (fs.existsSync(target)) fs.unlinkSync(target); }
      else write(target, contents);
    }
    cp.execFileSync('pm2', ['restart', 'QCare'], { encoding: 'utf8' });
    throw new Error('Audit update rolled back: ' + error.message + '. Backup: ' + backup);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
