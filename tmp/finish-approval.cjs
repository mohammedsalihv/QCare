const fs=require('fs');
function edit(p,fn){const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,fn(s));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,90));return s.replace(a,b);}
edit('client/src/pages/ClinicalAuditWorkspace.jsx',s=>{
s="import AuditScheduleApproval from '../components/audit/AuditScheduleApproval';\nimport { dubaiDay } from '../components/audit/auditSchedule';\n"+s;
s=replace(s,"const [view, setView] = useState('dashboard');","const [view, setView] = useState('dashboard');\n  const [approvalAudit, setApprovalAudit] = useState(null);\n  const [calendarFocusDate, setCalendarFocusDate] = useState('');");
s=replace(s,'const editable = canEdit(audit)',"if (audit.status === 'pending-approval') {\n      const { data } = await axios.get(`/api/audit/${audit._id}`, config());\n      setApprovalAudit(data); return;\n    }\n    const editable = canEdit(audit)");
s=replace(s,'const scheduleAudit = async details => {',`const approveSchedule = async (audit, comment) => {
    const { data } = await axios.put(\`/api/audit/\${audit._id}/schedule-approval\`, { expectedVersion: audit.__v || 0, comment }, config());
    setApprovalAudit(null); setCalendarFocusDate(dubaiDay(data.scheduledDate)); setView('calendar');
    await refresh(); showNotification('Schedule approved and published to the calendar', 'success');
  };
  const scheduleAudit = async details => {`);
s=replace(s,"showNotification('Audit schedule updated', 'success'); return;","setView('audits'); setStatus('pending-approval'); setSearch(''); showNotification('Schedule changes submitted for QM approval', 'success'); return;");
s=replace(s,"setView('calendar'); window.scrollTo({ top: 0, behavior: 'instant' }); showNotification('Audit scheduled', 'success');","setView('audits'); setStatus('pending-approval'); setSearch(''); window.scrollTo({ top: 0, behavior: 'instant' }); showNotification('Audit submitted for QM approval', 'success');");
s=replace(s,"{view === 'dashboard' &&",`{audits.some(a => a.status === 'pending-approval') && <div className="ca-approval-banner"><ShieldCheck size={23} /><div><strong>{audits.filter(a => a.status === 'pending-approval').length} schedule requests awaiting QM approval</strong><p>Proposed visits appear in the calendar only after approval.</p></div><button className="ca-button ca-secondary" onClick={() => { setStatus('pending-approval'); setSearch(''); setView('audits'); }}>Review requests</button></div>}
      {view === 'dashboard' &&`);
s=replace(s,'<AuditCalendar audits={audits}','<AuditCalendar initialDate={calendarFocusDate} audits={audits}');
s=replace(s,'{modal && <AuditScheduleDialog','{approvalAudit && <AuditScheduleApproval audit={approvalAudit} canApprove={isManager} onApprove={approveSchedule} onClose={() => setApprovalAudit(null)} />}\n    {modal && <AuditScheduleDialog');
return s;});
edit('client/src/components/audit/auditPresentation.js',s=>s.replace("{ scheduled:","{ 'pending-approval': 'Awaiting QM approval', scheduled:").replace("audit => ['scheduled', 'overdue']","audit => ['pending-approval', 'scheduled', 'overdue']"));
edit('client/src/components/audit/AuditRegister.jsx',s=>s.replace("['scheduled', 'in-progress'","['pending-approval', 'scheduled', 'in-progress'").replace("['scheduled', 'overdue']","['pending-approval', 'scheduled', 'overdue']").replace("{audit.status === 'pending-review' ?", "{audit.status === 'pending-approval' ? (canManage ? 'Review schedule' : 'View request') : audit.status === 'pending-review' ?").replace('<td data-label="Schedule"><p','<td data-label="Schedule">{audit.status === \'pending-approval\' && <span className="ca-date-count">Proposed · approval pending</span>}<p'));
edit('client/src/components/audit/AuditOverview.jsx',s=>s.replace("!['completed', 'pending-review']","!['pending-approval', 'completed', 'pending-review']"));
edit('client/src/components/audit/AuditPlanningDialog.jsx',s=>s.replace('Choose the location, people and dates for your audit.','Choose the location, people and proposed dates. QM approval is required before calendar publication.').replace("'Save schedule changes' : 'Schedule audit'","'Submit changes for approval' : 'Submit for approval'"));
edit('client/src/components/audit/AuditCalendarView.jsx',s=>{
s=s.replace('canSchedule, busy })','canSchedule, busy, initialDate })').replace('useState(today), [month, setMonth] = useState(today.slice(0, 7))',"useState(initialDate || today), [month, setMonth] = useState((initialDate || today).slice(0, 7))");
s=s.replace('audits.flatMap(audit =>',"audits.filter(audit => ['scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'].includes(audit.status)).flatMap(audit =>");
s=s.replace('All audit visits · Dubai time','Published audit visits · Dubai time');
s=s.replace("${date === today ? 'is-today' : ''}","${date === today ? 'is-today' : ''} ${visits.length ? 'has-visits' : ''}");
s=s.replace('<small>{visits.length} visit{visits.length > 1 ? \'s\' : \'\'}</small>', '<small className="ca-visit-count">{visits.length} visit{visits.length > 1 ? \'s\' : \'\'}</small><span className="ca-day-previews">{visits.slice(0, 2).map(v => <span key={v.key} title={`${sessionTime(v.startAt)} · ${v.audit.auditTitle}`}><b>{sessionTime(v.startAt)}</b> {v.audit.auditTitle}</span>)}</span>');
return s;});
edit('server/controllers/clinicalAuditWorkflow.js',s=>s.replace("if (!canEdit(req.user, audit)) fail('Only the auditor or quality manager can assign actions.', 403);","if (!canEdit(req.user, audit)) fail('Only the auditor or quality manager can assign actions.', 403);\n  if (audit.status === 'pending-approval') fail('QM approval is required before assigning actions.', 409);").replace("if (!action) fail('Action not found', 404);","if (audit.status === 'pending-approval') fail('QM approval is required before updating actions.', 409);\n  if (!action) fail('Action not found', 404);"));
for(const p of ['server/routes/clinicalAuditRoutes.js','server/tests/clinicalAuditPersistence.test.js','tmp/apply-audit-live.cjs','tmp/check-audit-report-proxy.cjs'])edit(p,s=>s.replaceAll("'8'","'9'").replaceAll('workflow 8','workflow 9'));
edit('server/tests/clinicalAudit.test.js',s=>s.replace('assert.equal(res.data.status, undefined)','assert.equal(res.data.status, \'pending-approval\')'));
edit('server/tests/clinicalAuditPersistence.test.js',s=>{
s=s.replace("assert.equal(updatedSchedule.body.status, 'scheduled')","assert.equal(updatedSchedule.body.status, 'pending-approval')");
s=s.replace('const id = created.body._id;',`const id = created.body._id;
    assert.equal(created.body.status, 'pending-approval');
    assert.equal((await request('/' + id + '/start', 'PUT', {})).status, 409);
    assert.equal((await request('/' + id + '/findings', 'PUT', { findings: [] })).status, 409);
    assert.equal((await request('/' + id + '/actions', 'POST', {})).status, 409);
    assert.equal((await request('?scope=calendar')).body.length, 0);
    const approvalPath = '/' + id + '/schedule-approval';
    assert.equal((await request(approvalPath, 'PUT', { expectedVersion: 0 }, staff)).status, 403);
    assert.equal((await request(approvalPath, 'PUT', { expectedVersion: 0 }, null)).status, 401);
    assert.equal((await request(approvalPath, 'PUT', { expectedVersion: 99 })).status, 409);
    const approved = await request(approvalPath, 'PUT', { expectedVersion: 0, comment: 'Dates agreed' });
    assert.equal(approved.status, 200, JSON.stringify(approved.body));
    assert.equal(approved.body.status, 'scheduled');
    assert.equal(String(approved.body.scheduleApprovedBy), String(manager._id));
    assert(approved.body.scheduleApprovedAt);
    assert.equal((await request('?scope=calendar')).body.length, 1);
    assert.equal((await request(approvalPath, 'PUT', { expectedVersion: 1 })).status, 409);
    const resubmitted = await request('/' + id, 'PUT', { ...payload, expectedVersion: 1 });
    assert.equal(resubmitted.body.status, 'pending-approval');
    assert.equal(resubmitted.body.scheduleApprovedAt, undefined);
    assert.equal((await request('?scope=calendar')).body.length, 0);
    assert.equal((await request(approvalPath, 'PUT', { expectedVersion: 2 })).status, 200);`);
return s;});
