import Select from '../components/Select';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuditDashboard from '../components/audit/AuditDashboard';
import AuditWorkspace from '../components/audit/AuditWorkspace';
import CorrectiveActionBoard from '../components/audit/CorrectiveActionBoard';
import AuditTemplateBuilder from '../components/audit/AuditTemplateBuilder';
import AuditScheduleDialog from '../components/audit/AuditScheduleDialog';
import AuditScopeSummary from '../components/audit/AuditScopeSummary';
import AuditCalendar, { AuditSessionSummary } from '../components/audit/AuditCalendar';
import { useNotification } from '../components/NotificationContext';

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''}` } });
const input = 'w-full border border-slate-200 rounded-xl p-3 bg-white';
const button = 'px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-40';
const initialAction = { actionText: '', owner: '', dueDate: '', priority: 'medium', criterionId: '', rootCause: '' };

export default function ClinicalAuditWorkspace() {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard');
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [initialSessionDate, setInitialSessionDate] = useState('');
  const [action, setAction] = useState(initialAction);
  const [comment, setComment] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = user._id || user.id;
  const isManager = ['qualitymanager', 'superadmin'].includes(user.role?.toLowerCase());
  const canEdit = audit => isManager || String(audit.auditor?._id || audit.auditor) === String(userId);
  const refresh = useCallback(async () => {
    const [list, dashboard] = await Promise.all([axios.get('/api/audit', config()), axios.get('/api/audit/dashboard', config())]);
    setAudits(list.data); setStats(dashboard.data);
  }, []);
  useEffect(() => {
    Promise.all([axios.get('/api/audit', config()), axios.get('/api/audit/dashboard', config()), axios.get('/api/audit/templates', config())])
      .then(([a, d, t]) => { setAudits(a.data); setStats(d.data); setTemplates(t.data); })
      .catch(err => setError(err.response?.data?.message || 'Unable to load audit workspace.'))
      .finally(() => setLoading(false));
    // Staff are only used for corrective action ownership; scheduling external audits is independent.
    axios.get('/api/users/directory', config()).then(u => setUsers(Array.isArray(u.data) ? u.data : u.data.users || [])).catch(() => setUsers([]));
  }, [refresh]);
  const run = async task => {
    setBusy(true); setError('');
    try { await task(); } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to save changes.'); }
    finally { setBusy(false); }
  };
  const openAudit = audit => run(async () => {
    const editable = canEdit(audit) && !['pending-review', 'completed'].includes(audit.status);
    const response = editable ? await axios.put(`/api/audit/${audit._id}/start`, {}, config()) : await axios.get(`/api/audit/${audit._id}`, config());
    setActive(response.data); setComment(''); setAction(initialAction); setView('detail');
  });
  const save = async findings => {
    await axios.put(`/api/audit/${active._id}/findings`, { findings }, config());
    showNotification('Audit progress saved', 'success');
  };
  const submit = async findings => {
    await save(findings);
    const response = await axios.put(`/api/audit/${active._id}/complete`, {}, config());
    setActive(response.data); await refresh(); showNotification('Audit submitted for independent review', 'success');
  };
  const review = decision => run(async () => {
    const response = await axios.put(`/api/audit/${active._id}/review`, { decision, comment }, config());
    setActive(response.data); await refresh(); showNotification(decision === 'approve' ? 'Audit approved' : 'Audit returned for changes', 'success');
  });
  const addAction = event => {
    event.preventDefault(); run(async () => {
      const result = await axios.post(`/api/audit/${active._id}/actions`, action, config());
      setActive(result.data);
      setAction(initialAction); await refresh(); showNotification('Corrective action assigned', 'success');
    });
  };
  const download = audit => run(async () => {
    const response = await axios.get(`/api/audit/${audit._id}/report/pdf`, { ...config(), responseType: 'blob' });
    const url = URL.createObjectURL(response.data), a = document.createElement('a');
    a.href = url; a.download = `AuditReport_${audit._id}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const scheduleAudit = async details => {
    await axios.post('/api/audit', details, config());
    await refresh(); setModal(false); setView('calendar'); showNotification('Audit scheduled', 'success');
  };
  const actions = audits.flatMap(a => (a.improvementActions || []).map(item => ({ ...item, auditId: a._id, auditTitle: a.auditTitle, auditorId: a.auditor?._id || a.auditor })));
  const filtered = audits.filter(a => (!status || a.status === status) && `${a.auditTitle} ${a.department || ''} ${a.location?.name || ''} ${(a.concernedPersons || []).map(p => p.employeeName).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const criteria = active?.criteriaSnapshot?.length ? active.criteriaSnapshot : active?.templateId?.criteria || [];
  const pending = audits.filter(a => a.status === 'pending-review').length;
  const overdueActions = actions.filter(a => a.status !== 'completed' && new Date(a.dueDate) < new Date(new Date().toDateString())).length;
  const canReview = active && isManager && String(active.auditor?._id || active.auditor) !== String(userId) && String(active.submittedBy) !== String(userId);
  return <DashboardLayout title="Clinical Audit & Governance"><div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Clinic audit workspace</h1><p className="text-slate-600">Track evidence, review findings, and verify improvement.</p></div>{isManager && <button onClick={() => { setError(''); setInitialSessionDate(''); setModal(true); }} className={`${button} bg-primary text-white`}>+ Schedule new audit</button>}</div>
    <nav className="flex flex-wrap gap-2" aria-label="Audit sections">{[['dashboard', 'Overview'], ['audits', 'Audits'], ['calendar', 'Calendar'], ['actions', 'Findings & actions'], ['templates', 'Templates']].map(([id, label]) => <button key={id} onClick={() => { setView(id); refresh().catch(() => setError('Unable to refresh audits.')); }} className={`${button} ${view === id ? 'bg-primary text-white' : 'bg-white'}`}>{label}</button>)}</nav>
    {error && <div role="alert" className="p-4 bg-rose-50 text-rose-700 rounded-xl">{error}</div>}
    {loading ? <p role="status">Loading clinic audits…</p> : <>
      {view === 'calendar' && <AuditCalendar audits={audits} onOpen={openAudit} canSchedule={isManager} busy={busy} onSchedule={date => { setInitialSessionDate(date); setModal(true); }} />}
      {view === 'templates' && <AuditTemplateBuilder templates={templates} canManage={isManager} onCreate={async body => { const result = await axios.post('/api/audit/templates', body, config()); setTemplates(prev => [...prev, result.data]); showNotification('Checklist template created', 'success'); }} />}
      {view === 'dashboard' && <><div className="grid sm:grid-cols-3 gap-4">{[['Awaiting review', pending], ['Overdue actions', overdueActions], ['Verified actions', actions.filter(a => a.status === 'completed').length]].map(([label, count]) => <div key={label} className="p-5 bg-white rounded-2xl border"><p className="text-2xl font-semibold">{count}</p><p>{label}</p></div>)}</div><AuditDashboard stats={stats} /></>}
      {view === 'audits' && <section className="space-y-4"><div className="flex flex-wrap gap-3"><input aria-label="Search audits" className={`${input} flex-1`} placeholder="Search audits, locations, departments or people" value={search} onChange={e => setSearch(e.target.value)} /><Select aria-label="Filter audit status" className="border rounded-xl p-3" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'].map(s => <option key={s}>{s}</option>)}</Select></div>
        {!filtered.length && <p className="p-8 bg-white rounded-2xl text-center">No audits match. Schedule an audit to get started.</p>}
        <div className="grid lg:grid-cols-2 gap-4">{filtered.map(a => <article key={a._id} className="bg-white border rounded-2xl p-5 space-y-4"><div className="flex justify-between gap-3"><h2 className="font-semibold text-lg">{a.auditTitle}</h2><span className="text-xs rounded-full bg-slate-100 p-2 self-start">{a.status.replaceAll('-', ' ')}</span></div><AuditScopeSummary audit={a} /><p className="text-sm">Auditor: {a.auditorName || a.auditor?.employeeName || 'Not specified'}</p><AuditSessionSummary audit={a} /><p className="text-sm">{a.standard}</p><p>Compliance: {a.overallScore == null || ['scheduled', 'overdue'].includes(a.status) ? 'N/A' : `${a.overallScore}%`} · Coverage: {a.coverage || 0}%</p><div className="flex gap-3"><button disabled={busy} onClick={() => openAudit(a)} className={`${button} bg-primary text-white`}>{a.status === 'pending-review' ? 'Review audit' : a.status === 'completed' || !canEdit(a) ? 'View audit' : 'Start / continue'}</button><button disabled={busy} onClick={() => download(a)} className={button}>PDF report</button></div></article>)}</div>
      </section>}
      {view === 'actions' && <CorrectiveActionBoard actions={actions} currentUser={userId} isManager={isManager} onUpdateStatus={async (auditId, actionId, nextStatus, completionEvidence) => { await axios.put(`/api/audit/${auditId}/actions/${actionId}`, { status: nextStatus, completionEvidence }, config()); await refresh(); }} />}
      {view === 'detail' && active && <div className="space-y-5"><button className={button} disabled={busy} onClick={() => { setView('audits'); refresh().catch(() => setError('Unable to refresh audits.')); }}>← Back to audits</button>
        <section className="p-5 bg-white border rounded-2xl space-y-2"><AuditScopeSummary audit={active} /><p className="font-semibold">Auditor: {active.auditorName || active.auditor?.employeeName || 'Not specified'}</p><AuditSessionSummary audit={active} /></section>
        <AuditWorkspace key={`${active._id}-${active.status}`} audit={active} onSaveFindings={save} onFinalize={submit} readOnly={!canEdit(active) || ['completed', 'pending-review'].includes(active.status)} />
        {active.status === 'pending-review' && isManager && <section className="p-6 bg-white border rounded-2xl space-y-3"><h2 className="font-semibold">Independent review</h2><p className="text-sm text-slate-600">The assigned auditor and submitter cannot approve their own audit.</p><label className="block">Reviewer comment<textarea className={input} value={comment} onChange={e => setComment(e.target.value)} /></label><div className="flex gap-3"><button disabled={busy || !canReview} className={`${button} bg-emerald-700 text-white`} onClick={() => review('approve')}>Approve audit</button><button disabled={busy || !canReview || !comment.trim()} className={button} onClick={() => review('return')}>Return for changes</button></div></section>}
        {canEdit(active) && <form onSubmit={addAction} className="p-6 bg-white border rounded-2xl space-y-4"><h2 className="font-semibold">Assign a corrective action</h2><label className="block">Action required<textarea required className={input} value={action.actionText} onChange={e => setAction({ ...action, actionText: e.target.value })} /></label><div className="grid md:grid-cols-2 gap-4"><label>Owner<Select aria-label="Owner" required className={input} value={action.owner} onChange={e => setAction({ ...action, owner: e.target.value })}><option value="">Select staff</option>{users.map(u => <option key={u._id} value={u._id}>{u.employeeName}</option>)}</Select></label><label>Due date<input required type="date" className={input} value={action.dueDate} onChange={e => setAction({ ...action, dueDate: e.target.value })} /></label><label>Priority<Select aria-label="Priority" className={input} value={action.priority} onChange={e => setAction({ ...action, priority: e.target.value })}>{['high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}</Select></label><label>Linked criterion<Select aria-label="Linked criterion" className={input} value={action.criterionId} onChange={e => setAction({ ...action, criterionId: e.target.value })}><option value="">General action</option>{criteria.map(c => <option key={c.criterionId} value={c.criterionId}>{c.text}</option>)}</Select></label></div><label className="block">Root cause<textarea className={input} value={action.rootCause} onChange={e => setAction({ ...action, rootCause: e.target.value })} /></label><button disabled={busy} className={`${button} bg-primary text-white`}>Assign action</button></form>}
        <section className="p-6 bg-white border rounded-2xl space-y-3"><h2 className="font-semibold">Audit history</h2>{active.history?.length ? active.history.map((h, i) => <p key={h._id || i} className="text-sm">{new Date(h.at).toLocaleString()} · {h.event.replaceAll('-', ' ')} {h.detail && `· ${h.detail}`}</p>) : <p className="text-sm text-slate-500">No recorded events for this legacy audit.</p>}</section>
      </div>}
    </>}
    {modal && <AuditScheduleDialog templates={templates} initialDate={initialSessionDate} onSchedule={scheduleAudit} onClose={() => { setModal(false); setError(''); }} />}
  </div></DashboardLayout>;
}
