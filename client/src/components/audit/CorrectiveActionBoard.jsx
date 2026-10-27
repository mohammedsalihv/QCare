import React, { useState } from 'react';
export default function CorrectiveActionBoard({ actions = [], onUpdateStatus, currentUser, isManager }) {
  const [evidence, setEvidence] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const columns = [['open', 'Open'], ['in-progress', 'In progress'], ['pending-verification', 'Awaiting verification'], ['completed', 'Verified']];
  const update = async (action, status) => {
    setBusy(action._id); setError('');
    try { await onUpdateStatus(action.auditId, action._id, status, evidence[action._id]); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(''); }
  };
  return <div className="space-y-4">
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {!actions.length && <p className="p-6 bg-white rounded-xl">No corrective actions yet. Open an audit to assign its first action.</p>}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{columns.map(([status, title]) => <section key={status} className="rounded-2xl border bg-slate-50 p-4 space-y-4">
      <h2 className="font-semibold">{title} <span className="text-slate-500">({actions.filter(a => a.status === status).length})</span></h2>
      {actions.filter(a => a.status === status).map(a => {
        const ownerId = a.owner?._id || a.owner;
        const canUpdate = isManager || String(currentUser) === String(ownerId) || String(currentUser) === String(a.auditorId);
        const canVerify = isManager && String(currentUser) !== String(ownerId);
        const overdue = status !== 'completed' && new Date(a.dueDate) < new Date(new Date().toDateString());
        return <article key={a._id} className="bg-white rounded-xl p-4 border space-y-3">
          <p className="text-xs text-slate-500">{a.auditTitle} · {a.criterionId || 'General'}</p><h3 className="font-semibold">{a.actionText}</h3>
          <p className="text-sm">{a.priority} priority · {a.owner?.employeeName || 'Assigned staff'}</p>
          <p className={overdue ? 'text-sm text-rose-700 font-semibold' : 'text-sm'}>Due {new Date(a.dueDate).toLocaleDateString()}{overdue ? ' · Overdue' : ''}</p>
          {a.rootCause && <p className="text-sm">Root cause: {a.rootCause}</p>}
          {a.completionEvidence && <p className="text-sm">Completion evidence: {a.completionEvidence}</p>}
          {status === 'in-progress' && canUpdate && <textarea aria-label="Completion evidence" className="w-full border rounded-lg p-2" placeholder="Describe completion evidence before verification" value={evidence[a._id] || ''} onChange={e => setEvidence(prev => ({ ...prev, [a._id]: e.target.value }))} />}
          {status === 'open' && canUpdate && <button disabled={!!busy} className="text-blue-700" onClick={() => update(a, 'in-progress')}>Start action</button>}
          {status === 'in-progress' && canUpdate && <button disabled={!!busy || !evidence[a._id]?.trim()} className="text-blue-700 disabled:opacity-40" onClick={() => update(a, 'pending-verification')}>Request verification</button>}
          {status === 'pending-verification' && canVerify && <div className="flex gap-4"><button disabled={!!busy} className="text-emerald-700" onClick={() => update(a, 'completed')}>Verify closure</button><button disabled={!!busy} className="text-amber-700" onClick={() => update(a, 'in-progress')}>Return</button></div>}
          {a.verifiedAt && <p className="text-xs text-emerald-700">Verified {new Date(a.verifiedAt).toLocaleDateString()}</p>}
        </article>;
      })}
    </section>)}</div>
  </div>;
}
