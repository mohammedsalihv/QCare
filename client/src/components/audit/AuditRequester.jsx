import { UserRound, Clock3 } from 'lucide-react';

export default function AuditRequester({ audit }) {
  const requestEvent = [...(audit.history || [])].reverse().find(item => ['schedule-requested', 'schedule-updated'].includes(item.event));
  const requester = audit.scheduleRequestedBy?.employeeName || requestEvent?.actor?.employeeName;
  const requestedAt = audit.scheduleRequestedAt || requestEvent?.at;
  const date = requestedAt ? new Date(requestedAt) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  return <div className="ca-requester" aria-label="Audit requester">
    <div><UserRound size={14} aria-hidden="true"/><span>Requested by <strong>{requester || 'Not recorded'}</strong></span></div>
    <div><Clock3 size={14} aria-hidden="true"/>{validDate ? <time dateTime={date.toISOString()}>{date.toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })} · Dubai</time> : <span>Request time not recorded</span>}</div>
  </div>;
}
