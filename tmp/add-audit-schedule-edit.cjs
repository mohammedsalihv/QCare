const fs = require('node:fs');
const edit = (p, fn) => fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
edit('server/controllers/clinicalAuditWorkflow.js', s => {
  s = s.replace("exports.scheduleAudit = wrap(async (req, res) => {\n  const { auditTitle", "async function scheduleValues(body, existing = null) {\n  const { auditTitle");
  s = s.replace('concernedPersons = [] } = req.body;', 'concernedPersons = [] } = body;');
  s = s.replace("  const template = await AuditTemplate.findOne({ _id: templateId, isActive: true });\n  if (!template?.criteria?.length) fail('Choose an active template with criteria.');\n  const ids = template.criteria.map(c => c.criterionId);", `  const keepTemplate = existing && same(existing.templateId, templateId);
  const template = keepTemplate ? await AuditTemplate.findById(templateId) : await AuditTemplate.findOne({ _id: templateId, isActive: true });
  const checklist = keepTemplate && existing.criteriaSnapshot?.length ? existing.criteriaSnapshot : template?.criteria;
  if (!checklist?.length) fail('Choose an active template with criteria.');
  const ids = checklist.map(c => c.criterionId);`);
  const start = s.indexOf('  const audit = await ClinicalAudit.create({ auditTitle');
  const end = s.indexOf('exports.startAudit', start);
  s = s.slice(0, start) + `  return { auditTitle, templateId, auditType, ...schedule, auditor: auditor || existing?.auditor || undefined, auditorName: auditorName?.trim() || undefined,
    location, concernedDepartments: departmentIds, concernedPersons: personIds,
    department: departments.length ? departments.map(d => d.name).join(', ') : (typeof department === 'string' ? department.trim() : ''), frequency: frequency || existing?.frequency || undefined,
    governancePillar: keepTemplate ? existing.governancePillar : template.governancePillar,
    standard: keepTemplate ? existing.standard : template.standard,
    criteriaSnapshot: checklist.map(c => ({ criterionId: c.criterionId, text: c.text, text_ar: c.text_ar, weight: c.weight })) };
}
exports.scheduleAudit = wrap(async (req, res) => {
  const audit = await ClinicalAudit.create({ ...await scheduleValues(req.body), history: [{ event: 'scheduled', actor: req.user._id }] });
  res.status(201).json(audit);
});
exports.updateScheduledAudit = wrap(async (req, res) => {
  if (!isManager(req.user)) fail('Only a quality manager or super admin can edit scheduled audits.', 403);
  if (!isValidObjectId(req.params.id)) fail('Invalid audit ID.');
  const audit = await ClinicalAudit.findById(req.params.id);
  if (!audit) fail('Audit not found.', 404);
  if (!['scheduled', 'overdue'].includes(audit.status) || audit.conductedDate || audit.findings.length || audit.improvementActions.length) fail('Only unstarted scheduled audits can be edited.', 409);
  if (!Number.isInteger(req.body.expectedVersion) || req.body.expectedVersion !== (audit.__v || 0)) fail('This audit changed elsewhere. Refresh the list before editing again.', 409);
  audit.set(await scheduleValues(req.body, audit));
  audit.status = 'scheduled';
  record(audit, req, 'schedule-updated', 'Audit details, scope and scheduled dates updated.');
  // Optimistic concurrency prevents overwriting a simultaneous start, edit or deletion.
  await audit.save();
  res.json(await load(req));
});
` + s.slice(end);
  return s;
});
edit('server/routes/clinicalAuditRoutes.js', s => s.replace("router.route('/:id')", "router.route('/:id')\n  .put(protect, authorize('QualityManager', 'SuperAdmin'), workflow.updateScheduledAudit)"));
for (const file of ['server/routes/clinicalAuditRoutes.js', 'server/tests/clinicalAuditPersistence.test.js', 'tmp/apply-audit-live.cjs', 'tmp/check-audit-report-proxy.cjs']) edit(file, s => s.replaceAll("Workflow', '6'", "Workflow', '7'").replaceAll(".workflow, '6'", ".workflow, '7'").replaceAll("=== '6'", "=== '7'").replaceAll("workflow: '6'", "workflow: '7'").replaceAll("workflow'), '6'", "workflow'), '7'").replaceAll('workflow 6', 'workflow 7'));
edit('client/src/components/audit/auditDatePlan.js', s => `import { dubaiDay, sessionTime } from './auditSchedule.js';\n` + s + `
export function datePlanFromAudit(audit) {
  if (!audit?.sessions?.length) return initialDatePlan(audit?.scheduledDate ? dubaiDay(audit.scheduledDate) : '');
  const dateWindows = {};
  for (const slot of [...audit.sessions].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))) {
    const day = dubaiDay(slot.startAt);
    (dateWindows[day] ||= []).push({ start: sessionTime(slot.startAt), end: sessionTime(slot.endAt) });
  }
  return { dates: Object.keys(dateWindows).sort(), mode: 'individual', windows: initialDatePlan().windows, dateWindows };
}
`);
edit('client/src/components/audit/AuditPlanningDialog.jsx', s => s.replace('buildAuditDates, initialDatePlan', 'buildAuditDates, datePlanFromAudit, initialDatePlan').replace("initialDate = '' })", "initialDate = '', audit = null })").replace("useState({ auditTitle: '', templateId: '', auditType: 'planned', location: '', concernedDepartments: [], concernedPersons: [], auditorName: '' })", "useState(() => audit ? { auditTitle: audit.auditTitle, templateId: audit.templateId?._id || audit.templateId || '', auditType: audit.auditType, location: audit.location?._id || audit.location || '', concernedDepartments: (audit.concernedDepartments || []).map(d => d._id || d), concernedPersons: (audit.concernedPersons || []).map(p => p._id || p), auditorName: audit.auditorName || '' } : { auditTitle: '', templateId: '', auditType: 'planned', location: '', concernedDepartments: [], concernedPersons: [], auditorName: '' })").replace('initialDatePlan(initialDate));', 'audit ? datePlanFromAudit(audit) : initialDatePlan(initialDate));').replace('const available = templates.filter(t => t.criteria?.length);', "const available = templates.filter(t => t.criteria?.length);\n  if (audit?.templateId?._id && !available.some(t => t._id === audit.templateId._id)) available.push({ ...audit.templateId, standard: audit.standard });").replace('>Schedule clinic audit</h2>', ">{audit ? 'Edit scheduled audit' : 'Schedule clinic audit'}</h2>").replace("{busy ? 'Scheduling…' : 'Schedule audit'}", "{busy ? 'Saving…' : audit ? 'Save schedule changes' : 'Schedule audit'}"));
edit('client/src/pages/ClinicalAuditWorkspace.jsx', s => s.replace("const [modal, setModal] = useState(false);", "const [modal, setModal] = useState(false);\n  const [editingSchedule, setEditingSchedule] = useState(null);").replace('  const scheduleAudit = async details => {', `  const editSchedule = audit => run(async () => {
    const { data } = await axios.get(\`/api/audit/\${audit._id}\`, config());
    setEditingSchedule(data); setInitialSessionDate(''); setModal(true);
  });
  const scheduleAudit = async details => {
    if (editingSchedule) {
      await axios.put(\`/api/audit/\${editingSchedule._id}\`, { ...details, expectedVersion: editingSchedule.__v || 0 }, config());
      await refresh(); setModal(false); setEditingSchedule(null); showNotification('Audit schedule updated', 'success'); return;
    }`).replace("setError(''); setInitialSessionDate(''); setModal(true);", "setError(''); setEditingSchedule(null); setInitialSessionDate(''); setModal(true);").replaceAll('onDelete={deleteAudit}', 'onDelete={deleteAudit} onEditSchedule={editSchedule}').replace('setInitialSessionDate(date); setModal(true);', 'setEditingSchedule(null); setInitialSessionDate(date); setModal(true);').replace('<AuditScheduleDialog templates={templates}', '<AuditScheduleDialog audit={editingSchedule} templates={templates}').replace("setModal(false); setError('');", "setModal(false); setEditingSchedule(null); setError('');"));
for (const file of ['client/src/components/audit/AuditRegister.jsx', 'client/src/components/audit/AuditCalendarView.jsx']) edit(file, s => {
  const calendar = file.includes('Calendar');
  s = s.replace('Trash2,', 'Pencil, Trash2,').replace('onDelete,', 'onDelete, onEditSchedule,');
  const who = calendar ? 'event.audit' : 'audit', gate = calendar ? 'canSchedule' : 'canManage';
  const needle = '{' + gate + ' && canDeleteScheduledAudit(' + who + ') && <button className="ca-icon-button ca-delete-audit"';
  return s.replace(needle, '{' + gate + ' && canDeleteScheduledAudit(' + who + ') && <button className="ca-icon-button" disabled={busy} title="Edit scheduled audit" aria-label={`Edit scheduled audit ${' + who + '.auditTitle}`} onClick={() => onEditSchedule(' + who + ')}><Pencil size={17} /></button>}' + needle);
});
console.log('Scheduled audit editing added to API, planner, register and calendar.');
