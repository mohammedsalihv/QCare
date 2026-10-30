import React from 'react';
import { ShieldCheck, ArrowRight, Clock3, MapPin, CalendarDays, UserRound } from 'lucide-react';
import { AuditSessionSummary } from './AuditCalendar';
import { StandardBadge } from './AuditBadges';
import { departmentsLabel } from './auditPresentation';

export default function AuditApprovalRequests({ audits, onReview, busy }) {
  const requests = audits.filter(a => a.status === 'pending-approval').sort((a, b) => new Date(a.scheduleRequestedAt || 0) - new Date(b.scheduleRequestedAt || 0));
  return <section className="ca-panel ca-request-inbox">
    <header className="ca-request-header"><div className="ca-request-header-icon"><ShieldCheck size={26}/></div><div><p className="ca-eyebrow">Quality manager inbox</p><h2>Ready for your review</h2><p>Confirm the scope and dates before publishing to the shared calendar.</p></div><span className="ca-request-total"><strong>{requests.length}</strong> awaiting decision</span></header>
    {requests.length ? <><div className="ca-request-order"><Clock3 size={15}/> Oldest requests first <span>Each request is reviewed independently</span></div><div className="ca-request-grid">{requests.map(a => <article className="ca-request-card" key={a._id}>
      <div className="ca-request-card-top"><StandardBadge standard={a.standard}/><span className="ca-status" data-status="pending-approval">Awaiting approval</span></div>
      <h3>{a.auditTitle}</h3>
      <div className="ca-request-scope"><MapPin size={17}/><div><strong>{a.location?.name || 'Location not specified'}</strong><p>{departmentsLabel(a)}</p></div></div>
      <div className="ca-request-dates"><p><CalendarDays size={16}/> Proposed visits · Dubai time</p><AuditSessionSummary audit={a}/></div>
      <footer><div className="ca-request-person"><span><UserRound size={17}/></span><div><strong>{a.scheduleRequestedBy?.employeeName || 'Audit requester'}</strong><small>{a.scheduleRequestedAt ? new Date(a.scheduleRequestedAt).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) + ' · Dubai' : 'Request time not recorded'}</small></div></div><button className="ca-button ca-primary" disabled={busy} onClick={() => onReview(a)} aria-label={'Review and decide ' + a.auditTitle}>Review request<ArrowRight size={16}/></button></footer>
    </article>)}</div></> : <div className="ca-empty"><span className="ca-empty-icon"><ShieldCheck size={30}/></span><h3>You’re all caught up</h3><p>New audit requests will appear here for your decision.</p></div>}
  </section>;
}
