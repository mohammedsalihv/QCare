import { ArrowRight, Check, CheckCheck, Clock3, FileCheck2, Send, ShieldCheck, X } from 'lucide-react';
import './PrivilegeWorkflow.css';
import PrivilegeAuditHistory from './PrivilegeAuditHistory';

const date = value => value && !Number.isNaN(Date.parse(value))
  ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not recorded';
const initials = name => name?.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '—';

export default function PrivilegeWorkflow({ application: row }) {
  const pending = row.status === 'pending-approval';
  const approved = row.status === 'approved';
  const rejected = row.status === 'rejected';
  const decided = approved || rejected || Boolean(row.reviewedAt || row.approvalDate);
  const status = pending ? 'Awaiting approval' : (row.status || 'Unknown').replaceAll('-', ' ');
  const DecisionIcon = rejected ? X : decided ? CheckCheck : FileCheck2;
  const approver = row.assignedApprover?.employeeName;
  return <div className={`pw-workflow ${pending ? 'pw-is-pending' : rejected ? 'pw-is-rejected' : approved ? 'pw-is-approved' : ''}`} aria-label="Application approval workflow">
    <div className="pw-heading">
      <div><span className="pw-eyebrow"><ShieldCheck size={14} aria-hidden="true" /> APPLICATION JOURNEY</span><h5>{pending ? 'Your request is with the approver' : decided ? 'Your review is complete' : 'Track your application'}</h5><p>{pending ? 'Submitted successfully. The assigned reviewer will make the next decision.' : 'Follow the people and decisions behind this application.'}</p></div>
      <span className="pw-status"><span aria-hidden="true" />{status}</span>
    </div>
    <ol className="pw-track">
      <li className="pw-node pw-complete">
        <div className="pw-milestone"><span className="pw-marker"><Check size={16} aria-hidden="true" /></span><span>Requested</span><ArrowRight className="pw-arrow" size={16} aria-hidden="true" /></div>
        <div className="pw-panel"><div className="pw-panel-top"><Send size={19} aria-hidden="true" /><span>STEP 01</span></div><span className="pw-label">REQUESTED BY</span><strong>{row.requestedBy?.employeeName || 'Requester not recorded'}</strong><span className="pw-caption">Application submitted</span><div className="pw-panel-footer"><Check size={14} aria-hidden="true" /><span>{date(row.createdAt)}</span></div></div>
      </li>
      <li className={`pw-node ${pending ? 'pw-active' : decided ? 'pw-complete' : ''}`} aria-current={pending ? 'step' : undefined}>
        <div className="pw-milestone"><span className="pw-marker">{decided ? <Check size={16} aria-hidden="true" /> : '02'}</span><span>{pending ? 'In review' : 'Assigned reviewer'}</span><ArrowRight className="pw-arrow" size={16} aria-hidden="true" /></div>
        <div className="pw-panel"><div className="pw-panel-top"><span className="pw-avatar" aria-hidden="true">{initials(approver)}</span><span>{pending ? 'ACTION REQUIRED' : 'STEP 02'}</span></div><span className="pw-label">ASSIGNED APPROVER</span><strong>{approver || 'Not assigned'}</strong><span className="pw-caption">{row.assignedApprover?.designation || row.assignedApprover?.role || 'Authorised reviewer'}</span><div className="pw-panel-footer"><Clock3 size={14} aria-hidden="true" /><span>{pending ? 'Awaiting their decision' : decided ? 'Review completed' : 'Review assignment'}</span></div></div>
      </li>
      <li className={`pw-node ${rejected ? 'pw-declined' : decided ? 'pw-complete' : 'pw-future'}`}>
        <div className="pw-milestone"><span className="pw-marker">{decided ? <DecisionIcon size={16} aria-hidden="true" /> : '03'}</span><span>Decision</span></div>
        <div className="pw-panel"><div className="pw-panel-top"><DecisionIcon size={21} aria-hidden="true" /><span>STEP 03</span></div><span className="pw-label">FINAL OUTCOME</span><strong className="pw-outcome">{pending ? 'Decision pending' : status}</strong><span className="pw-caption">{decided ? row.reviewedBy?.employeeName || row.approvedBy?.employeeName || 'Reviewer not recorded' : 'Approval or rejection will appear here'}</span><div className="pw-panel-footer"><DecisionIcon size={14} aria-hidden="true" /><span>{decided ? date(row.reviewedAt || row.approvalDate) : 'Next milestone'}</span></div></div>
      </li>
    </ol>
    <div className="pw-footnote"><ShieldCheck size={17} aria-hidden="true" /><span>{pending ? 'Clinical privileges begin only after approval — submitting a request does not authorise practice.' : 'The decision and application details are retained below for reference.'}</span></div>
    <PrivilegeAuditHistory application={row} />
  </div>;
}
