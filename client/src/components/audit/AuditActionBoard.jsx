import React, { useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ListChecks, UserRound } from 'lucide-react';
import { StatusBadge } from './AuditBadges';
import { dateLabel } from './auditPresentation';

export default function AuditActionBoard({ actions = [], onUpdateStatus, currentUser, isManager }) {
  const [evidence, setEvidence] = useState({}), [busy, setBusy] = useState(''), [error, setError] = useState('');
  const columns = [['open', 'Open actions'], ['in-progress', 'In progress'], ['pending-verification', 'Awaiting verification'], ['completed', 'Verified']];
  const update = async (action, status) => {
    setBusy(action._id); setError('');
    try { await onUpdateStatus(action.auditId, action._id, status, evidence[action._id]); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(''); }
  };
  return <div className="ca-stack"><header className="ca-library-heading"><div><p className="ca-eyebrow">From findings to improvement</p><h2>Corrective action plan</h2><p>Clear ownership, agreed deadlines and verified closure.</p></div><span className="ca-count">{actions.length} action{actions.length !== 1 ? 's' : ''}</span></header>
    {error && <p role="alert" className="ca-alert">{error}</p>}
    {!actions.length && <div className="ca-panel ca-empty"><span className="ca-empty-icon"><ListChecks size={27} /></span><h3>No corrective actions yet</h3><p>Open an audit to assign improvements to the people responsible.</p></div>}
    {actions.length > 0 && <div className="ca-action-board">{columns.map(([status, title]) => {
      const items = actions.filter(a => a.status === status);
      return <section key={status} className="ca-action-column" data-status={status}><header className="ca-action-column-heading"><h3><i aria-hidden="true" />{title}</h3><span className="ca-count">{items.length}</span></header><div className="ca-action-column-body">{!items.length && <p className="ca-action-empty">No actions here</p>}{items.map(action => {
        const owner = action.owner?._id || action.owner;
        const canUpdate = isManager || String(currentUser) === String(owner) || String(currentUser) === String(action.auditorId);
        const canVerify = isManager && String(currentUser) !== String(owner);
        const overdue = status !== 'completed' && new Date(action.dueDate) < new Date(new Date().toDateString());
        return <article key={action._id} className="ca-action-card"><StatusBadge status={action.priority} /><h4>{action.actionText}</h4><p className="ca-small">{action.auditTitle} · {action.criterionId || 'General action'}</p><div className="ca-action-card-meta"><p><UserRound size={13} />{action.owner?.employeeName || 'Assigned staff'}</p><p className={overdue ? 'ca-danger-text' : ''}><CalendarDays size={13} />Due {dateLabel(action.dueDate)}{overdue ? ' · Overdue' : ''}</p></div>
          {(action.rootCause || action.completionEvidence) && <details><summary>View action details</summary>{action.rootCause && <p>Root cause: {action.rootCause}</p>}{action.completionEvidence && <p>Completion evidence: {action.completionEvidence}</p>}</details>}
          {status === 'in-progress' && canUpdate && <textarea aria-label="Completion evidence" className="ca-input" placeholder="Describe how this action was completed…" value={evidence[action._id] || ''} onChange={event => setEvidence(previous => ({ ...previous, [action._id]: event.target.value }))} />}
          {status === 'open' && canUpdate && <button disabled={!!busy} className="ca-button ca-secondary" onClick={() => update(action, 'in-progress')}>Start action<ArrowRight size={13} /></button>}
          {status === 'in-progress' && canUpdate && <button disabled={!!busy || !evidence[action._id]?.trim()} className="ca-button ca-primary" onClick={() => update(action, 'pending-verification')}>Request verification<ArrowRight size={13} /></button>}
          {status === 'pending-verification' && canVerify && <div className="ca-stack" style={{ gap: 7 }}><button disabled={!!busy} className="ca-button ca-primary" onClick={() => update(action, 'completed')}>Verify closure<CheckCircle2 size={13} /></button><button disabled={!!busy} className="ca-button ca-secondary" onClick={() => update(action, 'in-progress')}>Return</button></div>}
          {action.verifiedAt && <p className="ca-verified-note"><CheckCircle2 size={12} />Verified {dateLabel(action.verifiedAt)}</p>}
        </article>;
      })}</div></section>;
    })}</div>}
  </div>;
}
