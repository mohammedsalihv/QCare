import './PrivilegeAuditHistory.css';

const status = value => value ? value.replaceAll('-', ' ') : 'No previous status';
const timestamp = value => value && !Number.isNaN(Date.parse(value))
  ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'medium' }) + ' (UAE)'
  : 'Time not recorded';

export default function PrivilegeAuditHistory({ application }) {
  const entries = application.auditHistory || [];
  return <details className="pa-audit">
    <summary>Audit history ({entries.length} {entries.length === 1 ? 'event' : 'events'})</summary>
    <p>Application ID: <code>{application._id}</code></p>
    <p>Read-only history recorded when a submission or decision is saved. Times are shown in UAE time.</p>
    {!entries.some(entry => entry.action === 'submitted') && <p>Full audit history was not recorded for this older application. Earlier events have not been reconstructed.</p>}
    <ol>{entries.map((entry, index) => <li key={entry._id || index}>
      <h6>Application {entry.action}</h6>
      <dl>
        <dt>When</dt><dd>{timestamp(entry.occurredAt)}</dd>
        <dt>Performed by</dt><dd>{entry.actorName || 'Name not recorded'} · Employee ID: {entry.actorEmployeeId || 'Not recorded'}</dd>
        <dt>Role / designation</dt><dd>{[entry.actorRole, entry.actorDesignation].filter(Boolean).join(' / ') || 'Not recorded'}</dd>
        <dt>Status change</dt><dd>{status(entry.previousStatus)} → {status(entry.newStatus)}</dd>
        <dt>{entry.action === 'submitted' ? 'Application reason' : 'Review notes'}</dt><dd className="pa-audit-notes">{entry.notes || 'No notes provided'}</dd>
      </dl>
      <details><summary>Recorded procedure scope</summary><ul>{entry.procedures?.map((procedure, i) => <li key={i}>{procedure.name} · {status(procedure.level)} · {procedure.approved ? 'Approved' : entry.action === 'rejected' ? 'Not approved' : 'Requested'}</li>)}</ul></details>
    </li>)}</ol>
  </details>;
}
