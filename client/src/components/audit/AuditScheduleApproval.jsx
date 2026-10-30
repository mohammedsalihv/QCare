import AuditHistory from './AuditHistory';
import { useEffect, useRef, useState } from 'react';
import { CalendarCheck2, ShieldCheck, X } from 'lucide-react';
import AuditScopeSummary from './AuditScopeSummary';
import { AuditSessionSummary } from './AuditCalendar';
import { StatusBadge } from './AuditBadges';

export default function AuditScheduleApproval({ audit, canApprove, onApprove, onClose }) {
  const ref = useRef(null);
  const [comment, setComment] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  const approve = async (decision = 'approve') => {
    if (decision === 'reject' && !comment.trim()) { setError('A rejection reason is required.'); return; }
    setBusy(true); setError('');
    try { await onApprove(audit, comment, decision); } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to approve this schedule.'); }
    finally { setBusy(false); }
  };
  return <dialog ref={ref} className="ca-schedule-approval" aria-labelledby="schedule-approval-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="ca-panel-heading"><div><p className="ca-eyebrow">Quality manager approval</p><h2 id="schedule-approval-title">Review audit schedule</h2><p>Confirm the scope and every proposed date before publishing.</p></div><button className="ca-icon-button" aria-label="Close schedule review" disabled={busy} onClick={onClose}><X size={18} /></button></header>
    <div className="ca-approval-body ca-form">
      {error && <p role="alert" className="ca-alert">{error}</p>}
      {audit.scheduleRejectionReason && <p className="ca-alert"><strong>Rejection reason:</strong> {audit.scheduleRejectionReason} Edit this request to resubmit it.</p>}<div className="ca-approval-title"><h3>{audit.auditTitle}</h3><StatusBadge status={audit.status} /></div>
      <section className="ca-approval-section"><h3>Audit scope</h3><AuditScopeSummary audit={audit} /><p className="ca-small">Standard: {audit.standard} · Type: {audit.auditType}</p><p className="ca-small">Auditor: {audit.auditorName || audit.auditor?.employeeName || 'Not specified'}</p></section>
      <section className="ca-approval-section"><h3><CalendarCheck2 size={18} />Proposed dates & times</h3><p className="ca-small">Dubai time (UTC+04:00). These visits are not yet on the calendar.</p><AuditSessionSummary audit={audit} /></section>
      <section className="ca-approval-section"><h3>Request & decision history</h3><AuditHistory history={audit.history} /></section>
      {canApprove && audit.status === 'pending-approval' && <label>Decision comment (required for rejection)<textarea className="ca-input" maxLength={2000} value={comment} onChange={event => setComment(event.target.value)} disabled={busy} placeholder="Add a note about the agreed audit arrangements…" /></label>}
    </div>
    <footer className="ca-form-footer"><span className="ca-small">Approval publishes all proposed visits.</span><div className="ca-button-row"><button className="ca-button ca-secondary" disabled={busy} onClick={onClose}>Close</button>{canApprove && audit.status === 'pending-approval' && <button className="ca-button ca-secondary" disabled={busy} onClick={() => approve('reject')}>Reject schedule</button>}{canApprove && audit.status === 'pending-approval' && <button className="ca-button ca-primary" disabled={busy} onClick={() => approve('approve')}><ShieldCheck size={17} />{busy ? 'Approving…' : 'Approve schedule'}</button>}</div></footer>
  </dialog>;
}
