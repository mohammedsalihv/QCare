import { Check, Clock3, Send, UserRound, X } from 'lucide-react';
import './PrivilegeWorkflow.css';

const date = value => value && !Number.isNaN(Date.parse(value))
  ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not recorded';

export default function PrivilegeWorkflow({ application: row }) {
  const pending = row.status === 'pending-approval';
  const approved = row.status === 'approved';
  const rejected = row.status === 'rejected';
  const decided = approved || rejected || Boolean(row.reviewedAt || row.approvalDate);
  const status = pending ? 'Awaiting approval' : (row.status || 'Unknown').replaceAll('-', ' ');
  const DecisionIcon = rejected ? X : decided ? Check : Clock3;
  return <div className="pw-workflow" aria-label="Application approval workflow">
    <div className="pw-heading"><span>APPLICATION JOURNEY</span><span className={`pw-status ${pending ? 'pw-pending' : approved ? 'pw-approved' : rejected ? 'pw-rejected' : ''}`}>{status}</span></div>
    <ol className="pw-track">
      <li className="pw-node pw-complete"><span className="pw-icon"><Send size={19} aria-hidden="true" /></span><div><span className="pw-label">01 · REQUESTED</span><strong>{row.requestedBy?.employeeName || 'Requester not recorded'}</strong><small>Submitted {date(row.createdAt)}</small></div></li>
      <li className={`pw-node ${pending ? 'pw-active' : decided ? 'pw-complete' : ''}`} aria-current={pending ? 'step' : undefined}><span className="pw-icon"><UserRound size={19} aria-hidden="true" /></span><div><span className="pw-label">02 · ASSIGNED APPROVER</span><strong>{row.assignedApprover?.employeeName || 'Not assigned'}</strong><small>{row.assignedApprover?.designation || row.assignedApprover?.role || 'Authorised reviewer'}</small><span className="pw-caption">{pending ? 'Awaiting this reviewer’s decision' : decided ? 'Review completed' : 'Review assignment'}</span></div></li>
      <li className={`pw-node ${rejected ? 'pw-declined' : decided ? 'pw-complete' : 'pw-future'}`}><span className="pw-icon"><DecisionIcon size={19} aria-hidden="true" /></span><div><span className="pw-label">03 · DECISION</span><strong>{pending ? 'Decision pending' : status}</strong><small>{decided ? date(row.reviewedAt || row.approvalDate) : 'Approval or rejection recorded here'}</small>{decided && <span className="pw-caption">{row.reviewedBy?.employeeName || row.approvedBy?.employeeName || 'Reviewer not recorded'}</span>}</div></li>
    </ol>
    {pending && <p className="pw-footnote">The request has been submitted. Clinical privileges are not granted until approval.</p>}
  </div>;
}
