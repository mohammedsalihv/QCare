const from = require('node:module').createRequire('/home/salih/QCare/server/package.json');
const app = JSON.parse(require('child_process').execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
if (app?.pm2_env.pm_exec_path !== '/home/salih/QCare/server/index.js') throw Error('Unexpected QCare service');
from('dotenv').config({ path: require('path').join(app.pm2_env.pm_cwd, '.env'), quiet: true });
const mongoose = from('mongoose');
(async () => {
  await mongoose.connect(app.pm2_env.MONGO_URL || process.env.MONGO_URL);
  const user = await from('./models/users').findOne({ username: 'portal.superadmin' }).select('_id role isActive status');
  if (!user || user.role !== 'Quality' || user.isActive === false || user.status !== 'active') throw Error('Expected active Quality account');
  const templates = await from('./utils/seedClinicalAuditTemplates')(user._id);
  await from('./utils/clinicalAuditNotifications').syncPending();
  const token = from('jsonwebtoken').sign({ id: user._id }, app.pm2_env.JWT_SECRET || process.env.JWT_SECRET || 'default_secret', { expiresIn: '1m' });
  const get = async route => {
    const response = await fetch('http://127.0.0.1:5000/api/' + route, { headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw Error(route + ' returned ' + response.status);
    return response.json();
  };
  const permissions = await get('audit/permissions');
  if (!permissions.canManage) throw Error('Quality approval permission missing');
  const audits = await get('audit?status=pending-approval');
  const notifications = await get('notifications');
  const matched = audits.filter(a => notifications.some(n => n.actionLink === '/dashboard/audit?approval=' + a._id));
  if (matched.length !== audits.length) throw Error('Missing approval notifications');
  const library = await get('audit/templates');
  if (templates.some(t => !library.some(v => v.templateName === t.name))) throw Error('Missing starter template');
  console.log(JSON.stringify({ role: permissions.role, canManage: permissions.canManage, pendingRequests: audits.length, requestsWithNotifications: matched.length, templates }, null, 2));
  await mongoose.disconnect();
})().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });
