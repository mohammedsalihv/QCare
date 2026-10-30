import React, {useState} from 'react';
import axios from 'axios';
import {getAuthConfig} from '../utils/authConfig';
const time = value => new Date(value).toLocaleString('en-GB', { timeZone:'Asia/Dubai', dateStyle:'medium', timeStyle:'medium' });
const label = value => value?.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
export default function WorkflowNotificationDetail({ notification, notifications }) {
 const [fullHistory, setFullHistory] = useState(null), [failed, setFailed] = useState(false);
 const w = notification.workflow;
 if (!w?.recordId) return null;
 const history = (fullHistory || notifications).filter(n => n.workflow?.recordId === w.recordId && n.workflow?.module === w.module).sort((a,b) => new Date(a.workflow.occurredAt) - new Date(b.workflow.occurredAt));
 return <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm" aria-label="Workflow record">
  <div className="flex flex-wrap justify-between gap-2"><strong className={/reject|return/i.test(w.status) ? "text-rose-700" : /pending|awaiting/i.test(w.status) ? "text-amber-700" : "text-teal-800"}>{w.module} · {label(w.status)}</strong><time className="text-xs text-slate-500">{time(w.occurredAt || notification.createdAt)} · Dubai</time></div>
  <p className="mt-2 text-slate-700">Requested by <strong>{w.requester?.name || 'Not recorded'}</strong> · Action by <strong>{w.actor?.name || notification.user}</strong></p>
  {w.reason && <p className="mt-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-slate-800 whitespace-pre-wrap"><strong>Reason / comment: </strong>{w.reason}</p>}
  <details className="mt-3" onToggle={async e => { if (!e.currentTarget.open || fullHistory) return; try { const {data} = await axios.get('/api/notifications', {...getAuthConfig(), params:{recordId:w.recordId, module:w.module}}); setFullHistory(data); setFailed(false); } catch {setFailed(true);} }}><summary className="cursor-pointer font-semibold text-teal-700">Process history ({history.length})</summary><ol className="mt-3 space-y-3 border-l-2 border-teal-100 pl-4">{history.map(n => <li key={n._id}><strong>{label(n.workflow.status)}</strong><p className="text-xs text-slate-600">{n.workflow.actor?.name || n.user} · {time(n.workflow.occurredAt || n.createdAt)} Dubai</p>{n.workflow.reason && <p className="mt-1 whitespace-pre-wrap">{n.workflow.reason}</p>}</li>)}</ol><p className="mt-2 text-xs text-slate-500">{failed ? 'Unable to load complete history. Close and reopen to retry.' : 'Process log · Dubai time (up to 500 events).'}</p></details>
 </section>;
}
