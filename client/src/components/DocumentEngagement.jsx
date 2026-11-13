import { useEffect, useState } from 'react';
import axios from 'axios';
import UserSelect from './UserSelect';
import Select from './Select';
import { getAuthConfig } from '../utils/authConfig';
const when = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet';
export default function DocumentEngagement({ document: doc, approvers, onChanged, reviewOnly = false }) {
  const [data, setData] = useState(null), [revision, setRevision] = useState(0), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [reader, setReader] = useState(''), [readers, setReaders] = useState([]), [dueDate, setDueDate] = useState(''), [notify, setNotify] = useState(false);
  const [delegateId, setDelegateId] = useState(''), [until, setUntil] = useState(''), [reason, setReason] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    axios.get(`/api/documents/${doc._id}/reading`, { ...getAuthConfig(), signal: controller.signal }).then(({ data }) => { setData(data); setNotify(data.notifyOnOpen); }).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load reading information.'); });
    return () => controller.abort();
  }, [doc._id, doc.version, revision]);
  const send = async (route, body, refreshDocument = false) => {
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await axios.post(`/api/documents/${doc._id}/${route}`, body, getAuthConfig()); setNotice(data.message); setRevision(value => value + 1); if (refreshDocument) onChanged(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to save. Please retry.'); } finally { setBusy(false); }
  };
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const report = async () => {
    try {
      const { data } = await axios.get(`/api/documents/${doc._id}/report/download`, { ...getAuthConfig(), responseType: 'blob' });
      const url = URL.createObjectURL(data), link = document.createElement('a'); link.href = url; link.download = `reading-progress-v${doc.version}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Unable to download the reading report.'); }
  };
  const manager = doc.uploadedBy === user._id || ['admin','superadmin','qualitymanager','qualityofficer'].includes(String(user.role).toLowerCase());
  const delegateAllowed = doc.draftState === 'In review' && (doc.assignedApprover === user._id || ['admin','superadmin','qualitymanager','qualityofficer'].includes(String(user.role).toLowerCase()));
  return <section className="dl-engagement"><h3>{reviewOnly ? 'Review delegation' : 'Reading and follow-up'}</h3>{error && <p role="alert" className="dl-error">{error}</p>}{notice && <p role="status" className="dl-notice">{notice}</p>}
    {!reviewOnly && doc.status === 'Active' && <><p>Reading confirmation applies to published version {doc.version}. Opening a file does not confirm that it was read or understood.</p>{data?.mine?.acknowledgedAt ? <p className="dl-notice">You confirmed reading on {when(data.mine.acknowledgedAt)}.</p> : <button className="dl-primary" disabled={busy} onClick={() => send('acknowledge', { version: doc.version })}>I have read and understood this version</button>}
      <button disabled={busy} onClick={() => send('helpful', { version: doc.version, helpful: !data?.mine?.helpful })}>{data?.mine?.helpful ? 'Marked helpful — remove reaction' : 'This document is helpful'}</button>
      {data?.mine?.dueDate && <p>Your reading deadline: {when(data.mine.dueDate)}</p>}
      {manager && <details><summary>Assign reading</summary><p>Choose staff who already have access. Assigning reading does not grant new access.</p><UserSelect aria-label="Choose reader" value={reader} onChange={e => { setReader(e.target.value); if (e.target.value && !readers.some(p => p.id === e.target.value)) setReaders(previous => [...previous, { id: e.target.value, name: e.target.selectedOptions?.[0]?.text || 'Selected staff member' }]); }} /><ul>{readers.map(person => <li key={person.id}>{person.name} <button onClick={() => setReaders(list => list.filter(p => p.id !== person.id))}>Remove</button></li>)}</ul><label>Read by<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><label className="dl-check"><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />Notify the owner when someone first opens this version</label><button disabled={busy || !readers.length || !dueDate} onClick={() => send('reading', { readers: readers.map(p => p.id), dueDate, version: doc.version, notifyOnOpen: notify })}>Assign and notify readers</button></details>}
    </>}
    {!reviewOnly && data?.team && <details><summary>Who opened and read this version</summary><p>{data.rows.filter(item => item.firstOpenedAt).length} people opened · {data.rows.filter(item => item.acknowledgedAt).length} confirmed reading · {data.rows.filter(item => item.assignedAt && !item.acknowledgedAt).length} assigned readers still to confirm</p><div className="dl-table"><table><thead><tr>{['Person','First opened','Last opened','Times opened / downloads','Reading confirmation','Read by'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{data.rows.map(item => <tr key={item._id}><td>{item.user?.employeeName || 'Former staff member'}</td><td>{when(item.firstOpenedAt)}</td><td>{when(item.lastOpenedAt)}</td><td>{item.views} / {item.downloads}</td><td>{when(item.acknowledgedAt)}</td><td>{item.dueDate ? when(item.dueDate) : 'Not assigned'}</td></tr>)}{!data.rows.length && <tr><td colSpan={6}>No reading activity recorded yet.</td></tr>}</tbody></table></div><p>Opens count successful file delivery by the portal. They do not measure attention or time spent reading. All times are UAE time.</p></details>}
    {!reviewOnly && data?.team && <><p>{data.rows.filter(item => item.helpful).length} people marked this version helpful.</p><button onClick={report}>Download reading progress report (CSV)</button></>}
    {delegateAllowed && <details><summary>Delegate this review temporarily</summary><p>The delegate must be an independent Quality Manager or Medical Director. Delegation starts now and can last up to 30 days.</p><label>Delegate<Select value={delegateId} onChange={e => setDelegateId(e.target.value)}><option value="">Choose a reviewer</option>{approvers.map(person => <option key={person._id} value={person._id}>{person.employeeName}</option>)}</Select></label><label>End date<input type="date" value={until} onChange={e => setUntil(e.target.value)} /></label><label>Reason<textarea maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={busy || !delegateId || !until || !reason.trim()} onClick={() => send('delegate', { delegateId, until: until + 'T23:59:59+04:00', reason }, true)}>Save delegation</button>{doc.delegatedApprover && <><p>Delegation ends {when(doc.delegationUntil)}.</p><button disabled={busy || !reason.trim()} onClick={() => send('delegate', { revoke: true, reason }, true)}>Revoke delegation</button></>}</details>}
  </section>;
}
