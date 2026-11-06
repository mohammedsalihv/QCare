import { useState } from 'react';
import UserSelect from './UserSelect';
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const when = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }) : '';
export default function IncidentOpinions({ row, userId, reviewer, run, locked }) {
  const [recipient, setRecipient] = useState(''), [question, setQuestion] = useState('');
  const allowed = reviewer || same(row.primaryResponsible, userId) || same(row.assignedTo, userId) || same(row.secondaryResponsible, userId);
  return <section className="iw-card iw-padded"><h2>Department & manager opinions</h2><p>Request an assessment from a department head or manager. The selected person gets access to this incident and submits their own signed, dated response. All requested opinions must be received before closure.</p>{!(row.opinions || []).length && <p className="iw-note">No opinions requested.</p>}{(row.opinions || []).map(opinion => <Opinion key={opinion._id} opinion={opinion} canRespond={!locked && !opinion.respondedAt && same(opinion.recipient, userId)} run={run}/>)}{allowed && !locked && <form onSubmit={async e => { e.preventDefault(); if (await run('requestOpinion', { recipient, question })) { setRecipient(''); setQuestion(''); } }}><label>Department head / manager<UserSelect required value={recipient} onChange={e => setRecipient(e.target.value)}/></label><label>What opinion or advice is needed?<textarea required maxLength={5000} value={question} onChange={e => setQuestion(e.target.value)}/></label><button className="iw-primary">Request opinion</button></form>}</section>;
}
function Opinion({ opinion, canRespond, run }) {
  const [response, setResponse] = useState('');
  return <article className="iw-action"><h3>{opinion.recipient?.employeeName || 'Recipient unavailable'} · {opinion.respondedAt ? 'Opinion received' : 'Awaiting opinion'}</h3><small>Requested by {opinion.requestedBy?.employeeName || 'Unavailable user'} · {when(opinion.requestedAt)} (Dubai)</small><p>{opinion.question}</p>{opinion.respondedAt && <><p style={{ whiteSpace: 'pre-wrap' }}>{opinion.response}</p><small>Submitted by {opinion.recipient?.employeeName} · {when(opinion.respondedAt)} (Dubai)</small></>}{canRespond && <form onSubmit={e => { e.preventDefault(); run('respondOpinion', { opinionId: opinion._id, response }); }}><label>Your opinion / recommendations<textarea required maxLength={5000} value={response} onChange={e => setResponse(e.target.value)}/></label><button className="iw-primary">Submit my opinion</button></form>}</article>;
}
