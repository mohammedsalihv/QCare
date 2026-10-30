import AuditApprovalRequests from '../components/audit/AuditApprovalRequests';
import AuditHistory from '../components/audit/AuditHistory';
import AuditScheduleApproval from '../components/audit/AuditScheduleApproval';
import { dubaiDay } from '../components/audit/auditSchedule';
import { useLocation, useNavigate } from 'react-router-dom';
import Select from '../components/Select';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuditOverview from '../components/audit/AuditOverview';
import AuditRegister from '../components/audit/AuditRegister';
import { StatusBadge } from '../components/audit/AuditBadges';
import { auditStatus, displayLabel } from '../components/audit/auditPresentation';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, History, Layers3, LayoutDashboard, ListChecks, Plus, ShieldCheck } from 'lucide-react';
import '../components/audit/clinicalAudit.css';
import AuditWorkspace from '../components/audit/AuditWorkspace';
import CorrectiveActionBoard from '../components/audit/CorrectiveActionBoard';
import AuditTemplateBuilder from '../components/audit/AuditTemplateBuilder';
import AuditScheduleDialog from '../components/audit/AuditScheduleDialog';
import AuditScopeSummary from '../components/audit/AuditScopeSummary';
import AuditCalendar, { AuditSessionSummary } from '../components/audit/AuditCalendar';
import { useNotification } from '../components/NotificationContext';

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''}` } });
const initialAction = { actionText: '', owner: '', dueDate: '', priority: 'medium', criterionId: '', rootCause: '' };

export default function ClinicalAuditWorkspace() {
  const routeLocation = useLocation(), navigate = useNavigate();
  const { showNotification, confirm, fetchFeed } = useNotification();
  const [currentRole, setCurrentRole] = useState(null);
  const [view, setView] = useState('dashboard');
  const [approvalAudit, setApprovalAudit] = useState(null);
  const [calendarFocusDate, setCalendarFocusDate] = useState('');
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [initialSessionDate, setInitialSessionDate] = useState('');
  const [action, setAction] = useState(initialAction);
  const [comment, setComment] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = user._id || user.id;
  const isManager = ['quality', 'qualitymanager', 'superadmin'].includes((currentRole || user.role)?.toLowerCase());
  const canSchedule = isManager || (currentRole || user.role) === 'QualityOfficer';
  const ownsSchedule = audit => (currentRole || user.role) === 'QualityOfficer' && String(audit.scheduleRequestedBy?._id || audit.scheduleRequestedBy) === String(userId);
  const canEdit = audit => isManager || ownsSchedule(audit) || String(audit.auditor?._id || audit.auditor) === String(userId);
  const refresh = useCallback(async () => {
    const [list, dashboard] = await Promise.all([axios.get('/api/audit', config()), axios.get('/api/audit/dashboard', config())]);
    setAudits(list.data); setStats(dashboard.data);
  }, []);
  useEffect(() => {
    axios.get('/api/audit/permissions', config()).then(({ data }) => setCurrentRole(data.role)).catch(() => {});
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
    if (['pending-approval', 'schedule-rejected'].includes(audit.status)) {
      const { data } = await axios.get(`/api/audit/${audit._id}`, config());
      setApprovalAudit(data); return;
    }
    const editable = canEdit(audit) && !['pending-review', 'completed'].includes(audit.status);
    const response = editable ? await axios.put(`/api/audit/${audit._id}/start`, {}, config()) : await axios.get(`/api/audit/${audit._id}`, config());
    setActive(response.data); setComment(''); setAction(initialAction); setView('detail'); window.scrollTo({ top: 0, behavior: 'instant' });
  });
  useEffect(() => {
    const id = new URLSearchParams(routeLocation.search).get('approval');
    if (!id || loading) return;
    let mounted = true;
    axios.get(`/api/audit/${encodeURIComponent(id)}`, config()).then(({ data }) => {
      if (!mounted) return;
      setView('audits'); setStatus(data.status === 'pending-approval' ? 'pending-approval' : '');
      if (['pending-approval', 'schedule-rejected'].includes(data.status)) setApprovalAudit(data);
      navigate(routeLocation.pathname, { replace: true });
    }).catch(() => { if (mounted) setError('This audit request is no longer available.'); });
    return () => { mounted = false; };
  }, [loading, routeLocation.search, routeLocation.pathname, navigate]);
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
    let response;
    try { response = await axios.get(`/api/audit/${audit._id}/report/pdf`, { ...config(), responseType: 'blob' }); }
    catch (error) {
      if (error.response?.data instanceof Blob) {
        const body = await error.response.data.text();
        try { throw new Error(JSON.parse(body).message || 'Unable to download the audit report.'); }
        catch (parsed) { if (parsed instanceof SyntaxError) throw new Error('Unable to download the audit report.'); throw parsed; }
      }
      throw error;
    }
    if (!(await response.data.slice(0, 5).text()).startsWith('%PDF-')) throw new Error('The server did not return a valid PDF report. Please try again.');
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })), a = document.createElement('a');
    const title = (audit.auditTitle || 'Clinical-Audit').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
    const serverFilename = /filename="([^"]+)"/i.exec(response.headers['content-disposition'] || '')?.[1];
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    a.href = url; a.download = serverFilename?.replace(/[\\/]/g, '_') || `CMC_Clinical_Audit_${title}_${day}.pdf`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  const deleteAudit = audit => confirm({ title: 'Delete audit?', type: 'danger', confirmLabel: 'Delete audit',
    message: `Delete “${audit.auditTitle}” from the audit list and calendar? Its findings, actions and history will be retained in the deleted record.`,
    onConfirm: () => run(async () => {
      await axios.delete(`/api/audit/${audit._id}`, { ...config(), data: { expectedVersion: audit.__v || 0 } });
      setAudits(previous => previous.filter(item => item._id !== audit._id));
      await refresh(); showNotification('Audit deleted', 'success');
    }) });
  const editSchedule = audit => run(async () => {
    const { data } = await axios.get(`/api/audit/${audit._id}`, config());
    setEditingSchedule(data); setInitialSessionDate(''); setModal(true);
  });
  const approveSchedule = async (audit, comment, decision = 'approve') => {
    const { data } = await axios.put(`/api/audit/${audit._id}/schedule-approval`, { expectedVersion: audit.__v || 0, comment, decision }, config());
    setApprovalAudit(null); setCalendarFocusDate(dubaiDay(data.scheduledDate)); setView(decision === 'reject' ? 'audits' : 'calendar'); setStatus(decision === 'reject' ? 'schedule-rejected' : '');
    await refresh(); await fetchFeed(); showNotification(decision === 'reject' ? 'Schedule rejected with reason' : 'Schedule approved and published to the calendar', 'success');
  };
  const scheduleAudit = async details => {
    const { data } = editingSchedule
      ? await axios.put(`/api/audit/${editingSchedule._id}`, { ...details, expectedVersion: editingSchedule.__v || 0 }, config())
      : await axios.post('/api/audit', details, config());
    const published = data.status === 'scheduled';
    await refresh(); await fetchFeed(); setModal(false); setEditingSchedule(null); setSearch('');
    setStatus(published ? '' : 'pending-approval'); setView(published ? 'calendar' : 'audits');
    if (published) setCalendarFocusDate(dubaiDay(data.scheduledDate));
    window.scrollTo({ top: 0, behavior: 'instant' });
    showNotification(published ? 'Audit scheduled and published to the calendar' : 'Audit submitted for QM approval', 'success');
  };

  const actions = audits.flatMap(a => (a.improvementActions || []).map(item => ({ ...item, auditId: a._id, auditTitle: a.auditTitle, auditorId: a.auditor?._id || a.auditor })));
  const filtered = audits.filter(a => (!status || auditStatus(a) === status) && `${a.auditTitle} ${a.department || ''} ${a.location?.name || ''} ${(a.concernedPersons || []).map(p => p.employeeName).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const criteria = active?.criteriaSnapshot?.length ? active.criteriaSnapshot : active?.templateId?.criteria || [];
  const canReview = active && isManager && String(active.auditor?._id || active.auditor) !== String(userId) && String(active.submittedBy) !== String(userId);
  const openSchedule = () => { setError(''); setEditingSchedule(null); setInitialSessionDate(''); setModal(true); };
  const sections = [
    ['dashboard', 'Overview', LayoutDashboard, null], ['audits', 'Audits', ClipboardList, audits.length],
    ...(isManager ? [['approvals', 'Approval requests', ShieldCheck, audits.filter(a => a.status === 'pending-approval').length]] : []),
    ['calendar', 'Calendar', CalendarDays, null], ['actions', 'Findings & actions', ListChecks, actions.filter(a => a.status !== 'completed').length],
    ['templates', 'Templates', Layers3, templates.length]
  ];
  return <DashboardLayout title="Clinical Audit & Governance"><div className="ca-workspace">
    <header className="ca-page-header"><div className="ca-page-heading"><span className="ca-module-icon"><ShieldCheck size={27} /></span><div><p className="ca-eyebrow">Quality & governance</p><h1>Clinical audit</h1><p>Plan audits, review evidence and track clinical improvement.</p></div></div>{canSchedule && <button aria-label="+ Schedule new audit" onClick={openSchedule} className="ca-button ca-primary"><Plus size={18} />Schedule new audit</button>}</header>
    <nav className="ca-tabs" aria-label="Audit sections">{sections.map(([id, label, Icon, count]) => <button key={id} aria-label={label} aria-current={view === id || (view === 'detail' && id === 'audits') ? 'page' : undefined} onClick={() => { setView(id); window.scrollTo({ top: 0, behavior: 'instant' }); refresh().catch(() => setError('Unable to refresh audits.')); }}>{React.createElement(Icon, { size: 17 })}<span>{label}</span>{count != null && <span className="ca-tab-count" aria-hidden="true">{count}</span>}</button>)}</nav>
    {error && <div role="alert" className="ca-alert"><AlertCircle size={19} />{error}</div>}
    {loading ? <div className="ca-loading" role="status"><span />Loading clinic audits…</div> : <>
      {audits.some(a => a.status === 'pending-approval') && <div className="ca-approval-banner"><ShieldCheck size={23} /><div><strong>{audits.filter(a => a.status === 'pending-approval').length} schedule request{audits.filter(a => a.status === 'pending-approval').length === 1 ? '' : 's'} {isManager ? 'awaiting your decision' : 'awaiting QM approval'}</strong><p>{isManager ? 'Review these requests and approve or reject with a reason. Your new Quality Manager schedules publish immediately.' : 'These requests need QM approval before calendar publication. You can submit another audit while approval is pending.'}</p></div><button className="ca-button ca-secondary" onClick={() => { setStatus('pending-approval'); setSearch(''); setView(isManager ? 'approvals' : 'audits'); }}>{isManager ? 'Open approval requests' : 'View requests'}</button></div>}
      {view === 'dashboard' && <AuditOverview audits={audits} actions={actions} stats={stats} onOpen={openAudit} onView={(next, filter) => { setStatus(filter); setView(next); }} />}
      {view === 'audits' && <AuditRegister audits={filtered} search={search} status={status} setSearch={setSearch} setStatus={setStatus} onOpen={openAudit} onDownload={download} onDelete={deleteAudit} onEditSchedule={editSchedule} canUpdateSchedule={audit => isManager || ownsSchedule(audit)} canEdit={canEdit} busy={busy} onSchedule={openSchedule} canSchedule={canSchedule} canManage={isManager} />}
      {view === 'approvals' && isManager && <AuditApprovalRequests audits={audits} onReview={openAudit} busy={busy} />}
      {view === 'calendar' && <AuditCalendar initialDate={calendarFocusDate} audits={audits} onOpen={openAudit} onDownload={download} onDelete={deleteAudit} onEditSchedule={editSchedule} canUpdateSchedule={audit => isManager || ownsSchedule(audit)} canSchedule={canSchedule} canManage={isManager} busy={busy} onSchedule={date => { setEditingSchedule(null); setInitialSessionDate(date); setModal(true); }} />}
      {view === 'templates' && <AuditTemplateBuilder templates={templates} canManage={isManager}
        onCreate={async body => { const result = await axios.post('/api/audit/templates', body, config()); setTemplates(prev => [...prev, result.data]); showNotification('Checklist template created', 'success'); }}
        onUpdate={async (id, body) => { const result = await axios.put('/api/audit/templates/' + id, body, config()); setTemplates(prev => prev.map(t => t._id === id ? result.data : t)); showNotification('Checklist template updated', 'success'); }}
        onDelete={async template => { await axios.delete('/api/audit/templates/' + template._id, { ...config(), data: { expectedVersion: template.__v || 0 } }); setTemplates(prev => prev.filter(t => t._id !== template._id)); showNotification('Checklist template deleted', 'success'); }} />}
      {view === 'actions' && <CorrectiveActionBoard actions={actions} currentUser={userId} isManager={isManager} onUpdateStatus={async (auditId, actionId, nextStatus, completionEvidence) => { await axios.put(`/api/audit/${auditId}/actions/${actionId}`, { status: nextStatus, completionEvidence }, config()); await refresh(); }} />}
      {view === 'detail' && active && <div className="ca-stack">
        <div className="ca-detail-nav"><button className="ca-text-button" disabled={busy} onClick={() => { setView('audits'); window.scrollTo({ top: 0, behavior: 'instant' }); refresh().catch(() => setError('Unable to refresh audits.')); }}><ArrowLeft size={16} />Back to audits</button><StatusBadge status={active.status} /></div>
        <section className="ca-panel ca-audit-context"><div><p className="ca-eyebrow">Audit scope</p><AuditScopeSummary audit={active} /><p className="ca-small">Auditor: <strong>{active.auditorName || active.auditor?.employeeName || 'Not specified'}</strong></p></div><div><p className="ca-eyebrow">Scheduled dates · Dubai time</p><AuditSessionSummary audit={active} /></div></section>
        <AuditWorkspace key={`${active._id}-${active.status}`} audit={active} onSaveFindings={save} onFinalize={submit} readOnly={!canEdit(active) || ['completed', 'pending-review'].includes(active.status)} />
        {active.status === 'pending-review' && isManager && <section className="ca-panel ca-review-panel"><div className="ca-panel-heading"><div><p className="ca-eyebrow">Quality assurance</p><h2>Independent review</h2><p>A different quality manager must review and approve this assessment.</p></div><ShieldCheck size={24} /></div><div className="ca-panel-body ca-form"><label>Reviewer comment<textarea className="ca-input" value={comment} onChange={event => setComment(event.target.value)} placeholder="Record your review or the changes required…" /></label><div className="ca-button-row"><button disabled={busy || !canReview} className="ca-button ca-primary" onClick={() => review('approve')}><CheckCircle2 size={16} />Approve audit</button><button disabled={busy || !canReview || !comment.trim()} className="ca-button ca-secondary" onClick={() => review('return')}>Return for changes</button></div></div></section>}
        {canEdit(active) && <form onSubmit={addAction} className="ca-panel"><div className="ca-panel-heading"><div><p className="ca-eyebrow">Continuous improvement</p><h2>Assign a corrective action</h2><p>Define the improvement, select an owner and agree a due date.</p></div><ListChecks size={23} /></div><div className="ca-panel-body ca-form"><label>Action required<textarea required className="ca-input" value={action.actionText} onChange={event => setAction({ ...action, actionText: event.target.value })} placeholder="Describe what needs to change…" /></label><div className="ca-form-grid"><label>Owner<Select aria-label="Owner" required className="ca-input" value={action.owner} onChange={event => setAction({ ...action, owner: event.target.value })}><option value="">Select staff</option>{users.map(u => <option key={u._id} value={u._id}>{u.employeeName}</option>)}</Select></label><label>Due date<input required type="date" className="ca-input" value={action.dueDate} onChange={event => setAction({ ...action, dueDate: event.target.value })} /></label><label>Priority<Select aria-label="Priority" className="ca-input" value={action.priority} onChange={event => setAction({ ...action, priority: event.target.value })}>{['high', 'medium', 'low'].map(p => <option key={p} value={p}>{displayLabel(p)}</option>)}</Select></label><label>Linked criterion<Select aria-label="Linked criterion" className="ca-input" value={action.criterionId} onChange={event => setAction({ ...action, criterionId: event.target.value })}><option value="">General action</option>{criteria.map(c => <option key={c.criterionId} value={c.criterionId}>{c.text}</option>)}</Select></label></div><label>Root cause<textarea className="ca-input" value={action.rootCause} onChange={event => setAction({ ...action, rootCause: event.target.value })} placeholder="What contributed to this finding?" /></label></div><div className="ca-form-footer"><p className="ca-small">Actions are tracked separately until verified.</p><button disabled={busy} className="ca-button ca-primary"><Plus size={16} />Assign action</button></div></form>}
        <section className="ca-panel"><div className="ca-panel-heading"><div><p className="ca-eyebrow">Activity trail</p><h2>Audit history</h2></div><History size={22} /></div><AuditHistory history={active.history} /></section>
      </div>}
    </>}
    {approvalAudit && <AuditScheduleApproval audit={approvalAudit} canApprove={isManager} onApprove={approveSchedule} onClose={() => setApprovalAudit(null)} />}
    {modal && <AuditScheduleDialog directPublish={['quality', 'qualitymanager'].includes((currentRole || user.role)?.toLowerCase())} audit={editingSchedule} templates={templates} initialDate={initialSessionDate} onSchedule={scheduleAudit} onClose={() => { setModal(false); setEditingSchedule(null); setError(''); }} />}
  </div></DashboardLayout>;
}
