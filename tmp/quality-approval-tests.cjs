const fs=require('fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('client/src/components/audit/AuditTemplateManager.jsx',s=>s.replace('<p className="ca-template-preview">{template.criteria[0]?.text', '<p className="ca-template-preview">{template.criteria[0]?.text').replace('<div className="ca-template-meta">','{template.guidance && <p className="ca-template-guidance">{template.guidance} {template.sourceUrl && <a href={template.sourceUrl} target="_blank" rel="noreferrer">Reference guidance ↗</a>}</p>}<div className="ca-template-meta">'));
edit('server/tests/helpers/clinicalAuditBrowser.cjs',s=>s.replace("role: 'QualityManager'","role: 'Quality'").replace("      if (p === '/api/audit/templates')", "      if (p === '/api/audit/permissions') return send({ role: 'Quality', canManage: true });\n      if (p === '/api/audit/templates')"));
edit('server/tests/clinicalAuditPersistence.test.js',s=>{
s=s.replace("const location = await Location.create", "const quality = await makeUser('quality', 'Quality');\n    const location = await Location.create");
s=s.replace("app.use('/api/audit', require('../routes/clinicalAuditRoutes'));", "app.use('/api/audit', require('../routes/clinicalAuditRoutes')); app.use('/api/notifications', require('../routes/notificationRoutes'));");
s=s.replace('    const payload =', `    const notificationRequest = async (route = '', method = 'GET', user = quality) => {
      const response = await fetch(base + '/api/notifications' + route, { method, headers: { Authorization: 'Bearer ' + jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret') } });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await request('/permissions', 'GET', undefined, quality)).body.canManage, true);
    assert.equal((await request('/permissions', 'GET', undefined, staff)).body.canManage, false);
    const seed = require('../utils/seedClinicalAuditTemplates');
    const seeded = await seed(manager._id);
    assert.equal(seeded.length, 7); assert(seeded.every(t => t.criteria >= 8));
    const admcc = await Template.findOne({ standard: 'ADMCC' });
    assert.match(admcc.templateName, /CCTV/); assert.match(admcc.guidance, /starter/);
    await Template.updateOne({ _id: admcc._id }, { $set: { 'criteria.0.text': 'Locally approved CCTV checklist' } });
    await seed(manager._id);
    assert.equal((await Template.findById(admcc._id)).criteria[0].text, 'Locally approved CCTV checklist');
    await Template.deleteMany({ templateName: { $in: seeded.map(t => t.name) } });
    const payload =`);
s=s.replace("    const approvalPath =", `    const Notification = require('../models/Notification');
    const notices = await notificationRequest();
    assert.equal(notices.status, 200, JSON.stringify(notices.body));
    const notice = notices.body.find(n => n.actionLink === '/dashboard/audit?approval=' + id);
    assert(notice, 'Quality must see an actionable pending approval notification');
    assert.equal(notice.isRead, false);
    await notificationRequest();
    assert.equal(await Notification.countDocuments({ sourceKey: notice.sourceKey }), 1);
    const staffNotices = await notificationRequest('', 'GET', staff);
    assert(!staffNotices.body.some(n => n._id === notice._id));
    assert.equal((await notificationRequest('/' + notice._id + '/read', 'PATCH', staff)).status, 404);
    assert.equal((await notificationRequest('/' + notice._id + '/read', 'PATCH')).body.isRead, true);
    await notificationRequest('/' + notice._id, 'DELETE');
    assert(!(await notificationRequest()).body.some(n => n._id === notice._id), 'Polling must not restore dismissed notifications');
    // Repair an older pending request that predated notifications.
    await Notification.deleteOne({ _id: notice._id });
    assert((await notificationRequest()).body.some(n => n.sourceKey === notice.sourceKey));
    const approvalPath =`);
s=s.replace("expectedVersion: 0, comment: 'Dates agreed' });", "expectedVersion: 0, comment: 'Dates agreed' }, quality);");
s=s.replace('String(approved.body.scheduleApprovedBy), String(manager._id)','String(approved.body.scheduleApprovedBy), String(quality._id)');
s=s.replace("    assert(approved.body.scheduleApprovedAt);", "    assert(approved.body.scheduleApprovedAt);\n    assert((await Notification.findOne({ sourceKey: notice.sourceKey })).resolvedAt);");
return s;});
const extra=['server/models/Notification.js','server/controllers/notificationController.js','server/utils/clinicalAuditNotifications.js','server/utils/notificationVisibility.js','server/utils/seedClinicalAuditTemplates.js','server/data/clinicalAuditStarterTemplates.js'];
for(const p of ['tmp/audit-live-release.cjs','tmp/apply-audit-live.cjs'])edit(p,s=>s.replace('"server/assets/clinical-audit/FONT-LICENSE.txt"]','"server/assets/clinical-audit/FONT-LICENSE.txt", '+extra.map(x=>JSON.stringify(x)).join(', ')+']'));
