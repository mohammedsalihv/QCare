import DocumentFeedback from '../components/DocumentFeedback';
import DocumentEngagement from '../components/DocumentEngagement';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Select from '../components/Select';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import { getAuthConfig } from '../utils/authConfig';
import './DocumentLibrary.css';

const empty = { source: 'file', generatedText: '', name: '', type: 'Policy', department: '', ref: '', description: '', classification: 'Restricted', audience: 'Owner and reviewers', revisedDate: '', nextRevDate: '', expiryDate: '', changeSummary: '', assignedApprover: '', allowDownload: false };
const date = value => value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' }) : 'Not set';
const categories = ['Policy', 'Procedure', 'Guideline', 'Manual', 'Form', 'Certificate', 'Evidence'];
const tabs = ['Document library', 'My submissions', 'Awaiting approval', 'My reading tasks', 'Review due', 'Archived'];

export default function DocumentLibrary() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]), [approvers, setApprovers] = useState([]);
  const [tab, setTab] = useState('Document library'), [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0), [selected, setSelected] = useState(null), [editor, setEditor] = useState(null);
  const [form, setForm] = useState(empty), [file, setFile] = useState(null), [reason, setReason] = useState('');
  const [version, setVersion] = useState('current'), [preview, setPreview] = useState(''), [fileError, setFileError] = useState('');
  const row = documents.find(doc => doc._id === selected);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([axios.get('/api/documents', { ...getAuthConfig(), signal: controller.signal }), axios.get('/api/documents/options', { ...getAuthConfig(), signal: controller.signal }), axios.get('/api/documents/reading-tasks', { ...getAuthConfig(), signal: controller.signal })])
      .then(([docs, options, reading]) => { setDocuments(docs.data); setApprovers(options.data.approvers); setTasks(reading.data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load the document library.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!row) return;
    const controller = new AbortController(); let url;
    const part = version === 'draft' ? row.draft : version === 'current' ? row : row.versions?.find(item => item.version === version);
    if (!part || !['application/pdf', 'image/png', 'image/jpeg'].includes(part.fileMime) && part.fileMime) return;
    axios.get(`/api/documents/${row._id}/download`, { ...getAuthConfig(), params: { version: version === 'current' ? row.version : version }, responseType: 'blob', signal: controller.signal })
      .then(({ data }) => { if (controller.signal.aborted) return; url = URL.createObjectURL(data); setPreview(url); })
      .catch(() => { if (!controller.signal.aborted) setFileError('Preview is unavailable. Download the file if permitted, or ask the owner to check it.'); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [row, version]);
  const open = doc => { setSelected(doc._id); setVersion(doc.status === 'Draft' ? 'draft' : 'current'); setPreview(''); setFileError(''); setReason(''); };
  const edit = doc => {
    const data = doc?.draft || doc || {};
    setForm(Object.fromEntries(Object.entries(empty).map(([key, fallback]) => [key, ['revisedDate', 'nextRevDate', 'expiryDate'].includes(key) ? data[key]?.slice(0,10) || '' : key === 'source' ? (data.generatedText ? 'template' : 'file') : key === 'assignedApprover' ? doc?.assignedApprover || '' : data[key] ?? fallback])));
    setFile(null); setEditor(doc?._id || 'new'); setError(''); setNotice('');
  };
  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); if (file) body.append('file', file);
    try {
      const { data } = editor === 'new' ? await axios.post('/api/documents', body, getAuthConfig()) : await axios.put(`/api/documents/${editor}`, body, getAuthConfig());
      setEditor(null); setSelected(data._id); setVersion('draft'); setPreview(''); setFileError(''); setTab('My submissions'); setPage(1); setRevision(v => v + 1); setNotice('Draft saved. Submit it for review when it is ready.');
    } catch (e) { setError(e.response?.data?.message || 'Unable to save this draft. Your entries are retained.'); } finally { setBusy(false); }
  };
  const action = async (doc, command) => {
    if (['return', 'archive'].includes(command) && !reason.trim()) { setError('Add a reason before continuing.'); return; }
    setBusy(true); setError('');
    try {
      if (command === 'delete') await axios.delete(`/api/documents/${doc._id}`, getAuthConfig());
      else await axios.post(`/api/documents/${doc._id}/actions`, { command, reason }, getAuthConfig());
      setPreview(''); setFileError(''); setSelected(null); setRevision(v => v + 1); setReason('');
      setNotice(({ submit: 'Submitted to the assigned approver.', approve: 'Revision approved. The document team can now publish it.', return: 'Returned to the owner for changes.', publish: 'Approved revision published.', archive: 'Document archived. Its history is retained.', delete: 'Unsubmitted draft deleted.' })[command]);
    } catch (e) { setError(e.response?.data?.message || 'Unable to complete this action.'); } finally { setBusy(false); }
  };
  const download = async doc => {
    setError('');
    try {
      const { data } = await axios.get(`/api/documents/${doc._id}/download`, { ...getAuthConfig(), params: { download: true, version: version === 'current' ? doc.version : version }, responseType: 'blob' });
      const part = version === 'draft' ? doc.draft : version === 'current' ? doc : doc.versions.find(item => item.version === version);
      const url = URL.createObjectURL(data), link = document.createElement('a'); link.href = url; link.download = part.fileName || doc.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Download is unavailable or not permitted.'); }
  };
  const filtered = documents.filter(doc => {
    const matches = `${doc.name} ${doc.ref} ${doc.department} ${doc.draft?.name || ''}`.toLowerCase().includes(search.toLowerCase());
    const section = tab === 'My reading tasks' ? tasks.some(task => task.documentId === doc._id && !task.acknowledgedAt) : tab === 'Document library' ? doc.status === 'Active' : tab === 'Archived' ? doc.status === 'Archived' : tab === 'My submissions' ? doc.uploadedBy === user._id && doc.status !== 'Archived' : tab === 'Awaiting approval' ? ['In review', 'Approved'].includes(doc.draftState) : doc.status === 'Active' && new Date(doc.nextRevDate) < new Date();
    return matches && section;
  });
  const shown = filtered.slice((page - 1) * 10, page * 10);
  return <DashboardLayout><div className="dl-workspace">
    <header className="dl-heading"><div><p className="dl-eyebrow">EVIDENCE & DOCUMENTATION</p><h1>Document library</h1><p>Find published guidance, submit evidence and keep documents up to date.</p></div><button className="dl-primary" onClick={() => edit(null)}>Add document</button></header>
    {error && <p role="alert" className="dl-error">{error}</p>}{notice && <p role="status" className="dl-notice">{notice}</p>}
    <nav className="dl-tabs" aria-label="Document sections">{tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => { setTab(item); setPage(1); }}>{item}</button>)}</nav>
    <section className="dl-card"><div className="dl-toolbar"><input aria-label="Search documents" placeholder="Search title, reference or department" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><button onClick={() => { setError(''); setRevision(v => v + 1); }}>Refresh</button></div>
      <div className="dl-table"><Table><thead><tr>{['Document', 'Department', 'Version / status', 'Review date', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={5}>Loading documents…</td></tr> : shown.length ? shown.map(doc => <tr key={doc._id}><td><strong>{doc.name}</strong><small>{doc.type} · {doc.ref}</small></td><td>{doc.department}</td><td>Version {doc.version}<small>{doc.status === 'Active' ? 'Published' : doc.status}{doc.draftState ? ` · Revision: ${doc.draftState}` : ''}</small>{doc.status === 'Active' && new Date(doc.revisedDate) > new Date() && <small>Effective from {date(doc.revisedDate)}</small>}{doc.expiryDate && new Date(doc.expiryDate) < new Date() && <small>Expired</small>}</td><td>{date(doc.nextRevDate)}{new Date(doc.nextRevDate) < new Date() && <small className="dl-due">Review overdue</small>}</td><td><button onClick={() => open(doc)}>Open document</button>{doc.permissions.edit && <button onClick={() => edit(doc)}>{doc.status === 'Active' && !doc.draft ? 'Create revision' : 'Edit draft'}</button>}</td></tr>) : <tr><td colSpan={5}>No documents in this view.</td></tr>}</tbody></Table></div>
      <Pagination totalRecords={filtered.length} recordsPerPage={10} currentPage={page} onPageChange={setPage} />
    </section>
    {row && <section className="dl-card dl-detail" aria-label="Document details"><header className="dl-heading"><div><h2>{row.name}</h2><p>{row.description || 'No description provided.'}</p></div><button onClick={() => { setSelected(null); setPreview(''); }}>Close document</button></header>
      <div className="dl-metadata"><p><strong>Owner</strong>{row.ownerName || (row.uploadedBy === user._id ? user.employeeName : 'Owner not recorded')}</p><p><strong>Who can view</strong>{row.audience}</p><p><strong>Effective date</strong>{date(row.revisedDate)}</p><p><strong>Expiry date</strong>{date(row.expiryDate)}</p></div>
      <div className="dl-toolbar"><label>Version to view <Select value={version} onChange={e => { setVersion(e.target.value); setPreview(''); setFileError(''); }}>{row.status !== 'Draft' && <option value="current">Published version {row.version}</option>}{row.draft && <option value="draft">Proposed version {row.draft.version} · {row.draftState}</option>}{row.versions?.map(v => <option key={v.version} value={v.version}>Earlier version {v.version}</option>)}</Select></label>{row.permissions.download && <button onClick={() => download(row)}>Download selected version</button>}</div>
      {version === 'draft' && <p className="dl-notice">This is a proposed revision. It is not published guidance. {row.draft.changeSummary}</p>}
      {version !== 'current' && version !== 'draft' && <p className="dl-notice">Earlier version — use the published version for current guidance.</p>}
      {fileError && <p>{fileError}</p>}{preview ? <iframe key={preview} sandbox="allow-same-origin" title="Document preview" src={preview} className="dl-preview" /> : !fileError && <p>Preview is loading or unavailable for this file type. CSV files can be downloaded when permitted.</p>}
      <DocumentFeedback key={'feedback-' + row._id + row.version} document={row} /><DocumentEngagement key={row._id + row.version} document={row} approvers={approvers} onChanged={() => setRevision(value => value + 1)} />
      {row.permissions.workspace && <><div className="dl-metadata"><p><strong>Assigned approver</strong>{row.approverName || approvers.find(p => p._id === row.assignedApprover)?.employeeName || (row.assignedApprover === user._id ? user.employeeName : 'Reviewer not recorded')}</p><p><strong>Review status</strong>{row.draftState || 'No revision in progress'}</p></div>
        <label>Review or archive reason<textarea maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain what needs to change, or why the document should be archived." /></label>
        <div className="dl-actions">{row.permissions.submit && <button disabled={busy} className="dl-primary" onClick={() => action(row, 'submit')}>Submit for review</button>}{row.permissions.review && <><button disabled={busy} onClick={() => action(row, 'return')}>Request changes</button><button disabled={busy} className="dl-primary" onClick={() => action(row, 'approve')}>Approve this revision</button></>}{row.permissions.publish && <button disabled={busy} className="dl-primary" onClick={() => action(row, 'publish')}>Publish approved revision</button>}{row.permissions.archive && <button disabled={busy} onClick={() => action(row, 'archive')}>Archive document</button>}{row.permissions.delete && <details><summary>Delete unsubmitted draft</summary><p>This removes the draft from the library. Submitted or published documents cannot be deleted here.</p><button disabled={busy} onClick={() => action(row, 'delete')}>Confirm delete draft</button></details>}</div>
        <details><summary>Document history</summary><ul>{row.history?.length ? row.history.map(entry => <li key={entry._id}><strong>{entry.action}</strong> · {entry.actorName} · {date(entry.at)} · Version {entry.version}{entry.reason && <p>{entry.reason}</p>}</li>) : <li>No earlier history was recorded for this legacy document.</li>}</ul></details>
      </>}
    </section>}
    {editor && <div className="dl-overlay"><section role="dialog" aria-modal="true" aria-labelledby="document-editor-title" className="dl-editor"><header className="dl-heading"><div><h2 id="document-editor-title">{editor === 'new' ? 'Add a document' : 'Prepare a revision'}</h2><p>Save a draft first, then submit it to an independent approver.</p></div><button disabled={busy} onClick={() => setEditor(null)}>Close</button></header>{error && <p role="alert" className="dl-error">{error}</p>}
      <form onSubmit={save}><fieldset disabled={busy}><div className="dl-grid">
        <label>Document title *<input name="name" required maxLength={200} value={form.name} onChange={change} /></label>
        <label>Category *<Select name="type" value={form.type} onChange={change}>{categories.map(value => <option key={value}>{value}</option>)}</Select></label>
        <label>Department *<input name="department" required maxLength={150} value={form.department} onChange={change} /></label>
        <label>Reference *<input name="ref" required maxLength={100} value={form.ref} onChange={change} /></label>
        <label>Sensitivity<Select name="classification" value={form.classification} onChange={e => setForm(v => ({ ...v, classification: e.target.value, audience: 'Owner and reviewers' }))}><option>Restricted</option><option>Confidential</option><option>Secret</option></Select></label>
        <label>Who can view after publication<Select name="audience" value={form.audience} onChange={change}><option>Owner and reviewers</option>{form.classification === 'Restricted' && <><option>Department</option><option>All staff</option></>}</Select></label>
        <label>Effective date *<input type="date" required name="revisedDate" value={form.revisedDate} onChange={change} /></label>
        <label>Next review date *<input type="date" required name="nextRevDate" value={form.nextRevDate} onChange={change} /></label>
        <label>Expiry date (optional)<input type="date" name="expiryDate" value={form.expiryDate} onChange={change} /></label>
        <label>Independent approver *<Select name="assignedApprover" required value={form.assignedApprover} onChange={change}><option value="">Choose an approver</option>{approvers.map(person => <option key={person._id} value={person._id}>{person.employeeName}</option>)}</Select></label>
      </div><label>Short description<textarea name="description" maxLength={4000} value={form.description} onChange={change} /></label><label>What is new or changing? *<textarea name="changeSummary" required maxLength={2000} value={form.changeSummary} onChange={change} /></label>
      <label className="dl-check"><input type="checkbox" name="allowDownload" checked={form.allowDownload} onChange={change} />Allow readers to download</label><p>Viewing cannot prevent screenshots or copying. Document owners and reviewers can download for their work.</p>
      <label>Document source<Select name="source" value={form.source} onChange={change}><option value="file">Upload a file</option><option value="template">Generate a PDF from the standard template</option></Select></label>{form.source === 'template' ? <label>Document content *<textarea name="generatedText" required maxLength={8000} rows={12} value={form.generatedText} onChange={change} placeholder={'Purpose\n\nScope\n\nResponsibilities\n\nProcedure / evidence\n\nReferences'} /><span>Write the content under these headings. The PDF includes the title, reference, version, dates and change summary. It remains a draft until approved and published.</span></label> : <><label>{editor === 'new' ? 'Attach document *' : 'Replace file (optional)'}<input type="file" required={editor === 'new' && form.source === 'file'} accept=".pdf,.png,.jpg,.jpeg,.csv" onChange={e => setFile(e.target.files[0] || null)} /></label><p>PDF, PNG, JPG or CSV. Maximum 10 MB. Use PDF for approved guidance.</p></>}
      <footer className="dl-actions"><button type="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="dl-primary">{busy ? 'Saving…' : 'Save draft'}</button></footer></fieldset></form>
    </section></div>}
  </div></DashboardLayout>;
}
