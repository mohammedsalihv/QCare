import { useEffect, useState } from 'react';
import axios from 'axios';
import Select from './Select';
import { getAuthConfig } from '../utils/authConfig';
export default function DocumentFeedback({ document: doc }) {
  const [rows, setRows] = useState([]), [kind, setKind] = useState('Question'), [message, setMessage] = useState(''), [responses, setResponses] = useState({});
  const [revision, setRevision] = useState(0), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const manage = doc.uploadedBy === user._id || ['admin','superadmin','qualitymanager','qualityofficer'].includes(String(user.role).toLowerCase());
  useEffect(() => {
    const controller = new AbortController();
    axios.get(`/api/documents/${doc._id}/feedback`, { ...getAuthConfig(), signal: controller.signal }).then(({ data }) => setRows(data)).catch(() => { if (!controller.signal.aborted) setError('Unable to load feedback.'); });
    return () => controller.abort();
  }, [doc._id, revision]);
  const send = async (route, body) => {
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await axios.post(`/api/documents/${doc._id}/${route}`, body, getAuthConfig()); setNotice(data.message); setRevision(v => v + 1); if (route === 'feedback') setMessage(''); }
    catch (e) { setError(e.response?.data?.message || 'Unable to save feedback.'); } finally { setBusy(false); }
  };
  return <section className="dl-engagement"><h3>Questions and suggestions</h3><p>Feedback is shared with the document owner and team. It does not change the approved document.</p>{error && <p role="alert" className="dl-error">{error}</p>}{notice && <p role="status" className="dl-notice">{notice}</p>}
    {doc.status === 'Active' && <form onSubmit={e => { e.preventDefault(); send('feedback', { version: doc.version, kind, message }); }}><label>How can we help?<Select value={kind} onChange={e => setKind(e.target.value)}><option>Question</option><option>Suggestion</option><option>Outdated information</option></Select></label><label>Your question or suggestion<textarea required maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe what needs clarification or improvement. Avoid including patient-identifying information." /></label><button disabled={busy || !message.trim()}>Send to document owner</button></form>}
    <details><summary>{doc.permissions.workspace ? 'Feedback received' : 'Your feedback and responses'} ({rows.length})</summary>{rows.map(entry => <article key={entry._id}><p><strong>{entry.kind} · {entry.status}</strong> · Version {entry.version}</p><p>{entry.authorName} · {new Date(entry.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}</p><p style={{ whiteSpace: 'pre-wrap' }}>{entry.message}</p>{entry.replies.map(reply => <blockquote key={reply._id}><strong>{reply.authorName} · {reply.status}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{reply.message}</p></blockquote>)}{manage && <div><label>Response status<Select value={responses[entry._id]?.status || 'Under review'} onChange={e => setResponses(v => ({ ...v, [entry._id]: { ...v[entry._id], status: e.target.value } }))}>{['Under review','Accepted','Declined','Resolved'].map(status => <option key={status}>{status}</option>)}</Select></label><label>Reply<textarea maxLength={4000} value={responses[entry._id]?.message || ''} onChange={e => setResponses(v => ({ ...v, [entry._id]: { ...v[entry._id], message: e.target.value } }))} /></label><button disabled={busy || !responses[entry._id]?.message?.trim()} onClick={() => send(`feedback/${entry._id}/respond`, { status: responses[entry._id]?.status || 'Under review', message: responses[entry._id]?.message })}>Save response</button></div>}</article>)}{!rows.length && <p>No feedback yet.</p>}</details>
  </section>;
}
