const fs=require('fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('server/utils/clinicalAuditNotifications.js',s=>s.replace("sourceKey: { $regex: `^${prefix}` }, resolvedAt: null, sourceKey:","resolvedAt: null, sourceKey:"));
edit('server/models/Notification.js',s=>s.replace('enum: ["admin", "superadmin", "all", "user"]','enum: ["admin", "superadmin", "qualitymanager", "all", "user"]').replace('    recipientId: {','    sourceKey: { type: String, unique: true, sparse: true },\n    resolvedAt: Date,\n    recipientId: {'));
edit('server/controllers/notificationController.js',s=>{
s="const visibility = require('../utils/notificationVisibility');\nconst auditNotifications = require('../utils/clinicalAuditNotifications');\n"+s;
let a=s.indexOf('    const roleLower'), b=s.indexOf('    // Filter out');
s=s.slice(0,a)+"    if (auditNotifications.isQuality(req.user)) await auditNotifications.syncPending();\n    const roleQuery = visibility(req.user);\n\n"+s.slice(b);
a=s.indexOf('    let roleQuery;');b=s.indexOf('    // Add current user',a);
s=s.slice(0,a)+"    const roleQuery = visibility(req.user);\n\n"+s.slice(b);
s=s.replaceAll('Notification.findById(req.params.id)', 'Notification.findOne({ _id: req.params.id, ...visibility(req.user), deletedBy: { $ne: req.user._id } })');
return s;});
edit('server/controllers/clinicalAuditWorkflow.js',s=>{
s="const auditNotifications = require('../utils/clinicalAuditNotifications');\n"+s;
s=s.replace("['qualitymanager', 'superadmin']","['quality', 'qualitymanager', 'superadmin']");
s=s.replace("  res.json({ message: 'Audit deleted.'", "  await auditNotifications.resolve(deleted, 'deleted').catch(error => console.error('Audit notification:', error.message));\n  res.json({ message: 'Audit deleted.'");
s=s.replace('  res.status(201).json(audit);','  await auditNotifications.requestApproval(audit).catch(error => console.error(\'Audit notification:\', error.message));\n  res.status(201).json(audit);');
s=s.replace("  res.json(await load(req));\n});\nexports.approveSchedule", "  await auditNotifications.requestApproval(audit).catch(error => console.error('Audit notification:', error.message));\n  res.json(await load(req));\n});\nexports.approveSchedule");
s=s.replace('  await audit.save(); res.json(await load(req));',"  await audit.save();\n  await auditNotifications.resolve(audit, 'approved').catch(error => console.error('Audit notification:', error.message));\n  res.json(await load(req));");
return s;});
edit('server/routes/clinicalAuditRoutes.js',s=>s.replaceAll("authorize('QualityManager', 'SuperAdmin')","authorize('Quality', 'QualityManager', 'SuperAdmin')").replace("const workflow =", "router.get('/permissions', protectCurrentUser);\nfunction protectCurrentUser(req, res, next) { return require('../middleware/authMiddleware').protect(req, res, () => res.json({ role: req.user.role, canManage: require('../utils/clinicalAuditNotifications').isQuality(req.user) })); }\nconst workflow =").replace("'9'","'10'"));
edit('client/src/pages/ClinicalAuditWorkspace.jsx',s=>{
s=s.replace('const { showNotification, confirm }','const { showNotification, confirm, fetchFeed }');
s=s.replace("const [view, setView]", "const [currentRole, setCurrentRole] = useState(null);\n  const [view, setView]");
s=s.replace("['qualitymanager', 'superadmin'].includes(user.role?.toLowerCase())","['quality', 'qualitymanager', 'superadmin'].includes((currentRole || user.role)?.toLowerCase())");
s=s.replace("  useEffect(() => {\n    Promise.all", "  useEffect(() => {\n    axios.get('/api/audit/permissions', config()).then(({ data }) => setCurrentRole(data.role)).catch(() => {});\n    Promise.all");
s=s.replace('  const save = async findings => {',`  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('approval');
    if (!id || loading) return;
    const audit = audits.find(item => item._id === id && item.status === 'pending-approval');
    setView('audits'); setStatus('pending-approval');
    if (audit) setApprovalAudit(audit);
    window.history.replaceState({}, '', window.location.pathname);
  }, [audits, loading]);
  const save = async findings => {`);
s=s.replace("await refresh(); showNotification('Schedule approved", "await refresh(); await fetchFeed(); showNotification('Schedule approved");
s=s.replace("await refresh(); setModal(false)","await refresh(); await fetchFeed(); setModal(false)");
return s;});
edit('client/src/components/NotificationContext.jsx',s=>{
s=s.replace('useState, useCallback','useState, useCallback, useEffect');
s=s.replaceAll('http://192.168.1.160:5000/api/notifications','/api/notifications');
s=s.replace('    const clearFeed =',`    useEffect(() => {
        const refresh = () => { if (localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token) fetchFeed(); };
        const timer = setInterval(refresh, 30000);
        window.addEventListener('focus', refresh);
        return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [fetchFeed]);
    const clearFeed =`);
return s;});
edit('client/src/pages/Notifications.jsx',s=>s.replaceAll('http://192.168.1.160:5000/api/notifications','/api/notifications'));
for(const p of ['server/tests/clinicalAuditPersistence.test.js','tmp/apply-audit-live.cjs','tmp/check-audit-report-proxy.cjs'])edit(p,s=>s.replaceAll("'9'","'10'").replaceAll('workflow 9','workflow 10'));
