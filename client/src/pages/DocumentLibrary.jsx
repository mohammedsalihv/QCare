import { BookOpen, FileText, Clock3, ShieldCheck, Plus, RefreshCw, ArrowUpRight, FolderOpen, X } from 'lucide-react';
import DocumentEditor from '../components/DocumentEditor';
import DocumentAccess from '../components/DocumentAccess';
import DocumentActions from '../components/DocumentActions';
import DocumentFeedback from '../components/DocumentFeedback';
import DocumentEngagement from '../components/DocumentEngagement';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Select from '../components/Select';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import { getAuthConfig } from '../utils/authConfig';
import './DocumentLibrary.css';

const DocumentPdfViewer = lazy(() => import('../components/DocumentPdfViewer'));

const empty = { source: 'file', generatedText: '', name: '', type: 'Policy', department: '', ref: '', description: '', classification: 'Restricted', audience: 'Owner and reviewers', revisedDate: '', nextRevDate: '', expiryDate: '', changeSummary: '', assignedApprover: '', allowDownload: false };
const date = value => value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' }) : 'Not set';
const tabs = ['All documents', 'Document library', 'My submissions', 'Awaiting approval', 'My reading tasks', 'Review due', 'Archived'];

export default function DocumentLibrary() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [permissions, setPermissions] = useState({ upload: false, dashboard: false });
  const canUpload = permissions.upload === true, canViewDashboard = permissions.dashboard === true;
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]), [approvers, setApprovers] = useState([]);
  const visibleTabs = [...tabs.filter(item => canUpload || documents.some(doc => doc.permissions?.manageAccess) || !['My submissions', 'Review due', 'Archived'].includes(item)).filter(item => item !== 'Awaiting approval' || canUpload || documents.some(doc => doc.permissions?.review)), ...(canViewDashboard ? ['Dashboard'] : [])];
  const [tab, setTab] = useState('All documents'), [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0), [selected, setSelected] = useState(null), [editor, setEditor] = useState(null);
  const [form, setForm] = useState(empty), [file, setFile] = useState(null), [reason, setReason] = useState('');
  const [version, setVersion] = useState('current'), [preview, setPreview] = useState(''), [fileError, setFileError] = useState('');
  const detailRef = useRef(null);
  const [readerTab, setReaderTab] = useState('read');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [accessTarget, setAccessTarget] = useState(null);
  const manageAccess = doc => { setSelected(null); setAccessTarget(doc); };
  const canManageExisting = documents.some(doc => doc.permissions?.manageAccess);
  const row = documents.find(doc => doc._id === selected);
  const hasSelectedDocument = Boolean(row);
  useEffect(() => {
    const dialog = detailRef.current;
    if (!selected || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [selected, hasSelectedDocument]);
  const viewed = row && (version === 'draft' ? row.draft : version === 'current' ? row : row.versions?.find(item => item.version === version));
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([axios.get('/api/documents', { ...getAuthConfig(), signal: controller.signal }), axios.get('/api/documents/options', { ...getAuthConfig(), signal: controller.signal }), axios.get('/api/documents/reading-tasks', { ...getAuthConfig(), signal: controller.signal })])
      .then(([docs, options, reading]) => {
        if (controller.signal.aborted) return;
        // Reading documents must not depend on optional management capabilities.
        if (docs.status === 'fulfilled') { setDocuments(docs.value.data); setError(''); }
        else setError(docs.reason.response?.data?.message || 'Unable to load documents. Please refresh.');
        if (options.status === 'fulfilled') {
          setApprovers(options.value.data.approvers || []);
          setPermissions({ upload: options.value.data.permissions?.upload === true, dashboard: options.value.data.permissions?.dashboard === true });
        } else { setApprovers([]); setPermissions({ upload: false, dashboard: false }); }
        setTasks(reading.status === 'fulfilled' ? reading.value.data : []);
        if (reading.status === 'rejected') setNotice('Reading tasks could not be loaded. You can still view available documents in All documents.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!row) return;
    const controller = new AbortController(); let url;
    const part = version === 'draft' ? row.draft : version === 'current' ? row : row.versions?.find(item => item.version === version);
    if (!part || !['application/pdf', 'image/png', 'image/jpeg'].includes(part.fileMime) && part.fileMime) return;
    axios.get(`/api/documents/${row._id}/download`, { ...getAuthConfig(), params: { version: version === 'current' ? row.version : version }, responseType: 'blob', signal: controller.signal })
      .then(({ data }) => { if (controller.signal.aborted) return; url = URL.createObjectURL(data); setPreview({ url, mime: data.type }); })
      .catch(() => { if (!controller.signal.aborted) setFileError('Preview is unavailable. Download the file if permitted, or ask the owner to check it.'); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [row, version]);
  const open = doc => { setReaderTab('read'); setSelected(doc._id); setVersion(doc.status === 'Draft' ? 'draft' : 'current'); setPreview(''); setFileError(''); setReason(''); };
  const edit = doc => {
    if (doc ? !doc.permissions?.edit : !canUpload) { setError('You do not have permission to edit this document.'); return; }
    const data = doc?.draft || doc || {};
    setForm(Object.fromEntries(Object.entries(empty).map(([key, fallback]) => [key, ['revisedDate', 'nextRevDate', 'expiryDate'].includes(key) ? data[key]?.slice(0,10) || '' : key === 'source' ? (data.generatedText ? 'template' : 'file') : key === 'assignedApprover' ? doc?.assignedApprover || '' : data[key] ?? fallback])));
    setFile(null); setEditor(doc?._id || 'new'); setError(''); setNotice('');
  };
  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const save = async event => {
    event.preventDefault(); if (editor === 'new' ? !canUpload : !documents.find(doc => doc._id === editor)?.permissions?.edit) return; setBusy(true); setError('');
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
      setDeleteTarget(null);
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
    const matches = `${doc.name} ${doc.documentId} ${doc.ref} ${doc.department} ${doc.draft?.name || ''}`.toLowerCase().includes(search.toLowerCase());
    const section = tab === 'All documents' ? doc.status !== 'Archived' : tab === 'My reading tasks' ? tasks.some(task => task.documentId === doc._id && !task.acknowledgedAt) : tab === 'Document library' ? doc.status === 'Active' : tab === 'Archived' ? doc.status === 'Archived' : tab === 'My submissions' ? doc.uploadedBy === user._id && doc.status !== 'Archived' : tab === 'Awaiting approval' ? ['In review', 'Approved'].includes(doc.draftState) : doc.status === 'Active' && new Date(doc.nextRevDate) < new Date();
    return matches && section;
  });
  const summaries = [
    { label: 'Published documents', count: documents.filter(doc => doc.status === 'Active').length, icon: <BookOpen size={20} aria-hidden="true" />, tone: 'teal', target: 'Document library', hint: 'Approved guidance & evidence' },
    { label: 'Awaiting approval', count: documents.filter(doc => ['In review', 'Approved'].includes(doc.draftState)).length, icon: <ShieldCheck size={20} aria-hidden="true" />, tone: 'blue', target: 'Awaiting approval', hint: 'Ready for the next decision' },
    { label: 'Your reading tasks', count: tasks.filter(task => !task.acknowledgedAt).length, icon: <FileText size={20} aria-hidden="true" />, tone: 'violet', target: 'My reading tasks', hint: 'Read and confirm understanding' },
    { label: 'Review overdue', count: documents.filter(doc => doc.status === 'Active' && new Date(doc.nextRevDate) < new Date()).length, icon: <Clock3 size={20} aria-hidden="true" />, tone: 'amber', target: 'Review due', hint: 'Documents needing attention' }
  ];
  const shown = filtered.slice((page - 1) * 10, page * 10);
  return <DashboardLayout><div className="dl-workspace">
    <header className="dl-page-header"><div><p className="dl-eyebrow">EVIDENCE & DOCUMENTATION</p><h1>Document register</h1><p>Find, review and manage your team's documents.</p></div>{canUpload && <button className="dl-primary" onClick={() => edit(null)}><Plus size={18} aria-hidden="true" /> Add document</button>}</header>
    {error && <p role="alert" className="dl-error">{error}</p>}{notice && <p role="status" className="dl-notice">{notice}</p>}
    <nav className="dl-tabs" aria-label="Document sections">{visibleTabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => { setTab(item); setPage(1); }}>{item}</button>)}</nav>
    {canViewDashboard && tab === 'Dashboard' && <section aria-label="Document dashboard"><div className="dl-dashboard-heading"><h2>Document dashboard</h2><p>Overview of documents available to you. Select a card to open its document list.</p></div><section className="dl-summary-grid" aria-label="Document overview">{summaries.map(({label,count,icon,tone,target,hint}) => <button className={'dl-summary dl-tone-' + tone} key={label} onClick={() => { setTab(target); setPage(1); }}><span className="dl-summary-icon">{icon}</span><span className="dl-summary-body"><span>{label}</span><strong>{loading ? '—' : count}</strong><small>{hint}</small></span><ArrowUpRight className="dl-summary-arrow" size={17} aria-hidden="true" /></button>)}</section></section>}
    {tab !== 'Dashboard' && <section className="dl-card"><header className="dl-register-heading"><div><span className="dl-eyebrow">YOUR WORKSPACE</span><h2>{tab}</h2><p>{tab === 'My submissions' ? 'Your drafts and submissions, from first version to publication.' : 'Find the right document and see its status at a glance.'}</p></div><span className="dl-record-count">{filtered.length} {filtered.length === 1 ? 'document' : 'documents'}</span></header><div className="dl-toolbar"><input aria-label="Search documents" placeholder="Search name, document ID, reference or department" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><button onClick={() => { setError(''); setRevision(v => v + 1); }}><RefreshCw size={15} aria-hidden="true" /> Refresh</button></div>
      <div className="dl-table dl-register" role="region" aria-label="Document register"><Table><colgroup>{[3, 19, 10, 8, 8, 8, 8, 8, 6, 9, 8, 5].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup><thead><tr>{['S/N', 'Document', 'Reference number', 'Uploaded date', 'Reviewed date', 'Next revision date', 'Effective date', 'Expiry date', 'Type', 'Classification', 'Version / status', 'Actions'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={12}>Loading documents…</td></tr> : shown.length ? shown.map((doc, index) => <tr key={doc._id} className={selected === doc._id ? 'dl-selected-row' : ''}>
        <td data-label="S/N" className="dl-serial">{(page - 1) * 10 + index + 1}</td>
        <td data-label="Document" className="dl-name-cell"><button className="dl-name-link" onClick={() => open(doc)}>{doc.name}</button><small>{doc.department}</small><small className="dl-document-id"><span>Unique ID</span> {doc.documentId || 'Not recorded'}</small></td>
        <td data-label="Reference number" className="dl-reference">{doc.ref || 'Not recorded'}</td>
        <td data-label="Uploaded date" className="dl-date-cell">{date(doc.uploadDate || doc.createdAt)}</td>
        <td data-label="Reviewed date" className="dl-date-cell">{(doc.status === 'Draft' ? doc.draft?.reviewedAt || doc.draft?.approvedAt : doc.reviewedAt || doc.approvedAt) ? date(doc.status === 'Draft' ? doc.draft.reviewedAt || doc.draft.approvedAt : doc.reviewedAt || doc.approvedAt) : doc.status === 'Draft' ? 'Not reviewed yet' : 'Not recorded'}</td>
        <td data-label="Next revision date" className="dl-date-cell">{date(doc.nextRevDate)}{new Date(doc.nextRevDate) < new Date() && <small className="dl-due">Review overdue</small>}</td>
        <td data-label="Effective date" className="dl-date-cell">{date(doc.revisedDate)}</td>
        <td data-label="Expiry date" className="dl-date-cell">{date(doc.expiryDate)}{doc.expiryDate && new Date(doc.expiryDate) < new Date() && <small className="dl-due">Expired</small>}</td>
        <td data-label="Type">{doc.type}</td>
        <td data-label="Classification"><span className={'dl-classification dl-class-' + doc.classification?.toLowerCase()}>{doc.classification}</span></td>
        <td data-label="Version / status"><span className={'dl-status dl-status-' + doc.status.toLowerCase()}>{doc.status === 'Active' ? 'Published' : doc.status}</span><small>Version {doc.version}</small>{doc.draftState && doc.status !== 'Draft' && <small>Revision: {doc.draftState}</small>}</td>
        <td data-label="Actions"><DocumentActions document={doc} onView={open} onDetails={doc => { open(doc); setReaderTab('details'); }} onEdit={edit} onManage={manageAccess} onDelete={setDeleteTarget} /></td>
      </tr>) : <tr><td colSpan={12}><div className="dl-empty"><span className="dl-empty-icon"><FolderOpen size={30} aria-hidden="true" /></span><strong>No documents in this view.</strong><p>{canUpload ? 'Try another section or add your first document.' : 'No documents are currently available to you in this view.'}</p>{canUpload && <button className="dl-primary" onClick={() => edit(null)}>+ Add document</button>}</div></td></tr>}</tbody></Table></div>
      <Pagination totalRecords={filtered.length} recordsPerPage={10} currentPage={page} onPageChange={setPage} />
    </section>}
    {row && <dialog ref={detailRef} className="dl-reader" aria-labelledby="document-reader-title" onCancel={() => { setSelected(null); setPreview(''); }}><section className="dl-detail"><header className="dl-heading"><div><h2 id="document-reader-title">{viewed?.name || row.name}</h2></div><button title="Document options" aria-label="Toggle document options" aria-expanded={readerTab === 'details'} onClick={() => setReaderTab(v => v === 'read' ? 'details' : 'read')}>•••</button><button onClick={() => { setSelected(null); setPreview(''); }} aria-label="Close document reader"><X size={18} aria-hidden="true" /> Close</button></header>

      {error && <p role="alert" className="dl-error">{error}</p>}

      <div hidden={readerTab !== 'details'} className="dl-toolbar"><label>Version to view <Select value={version} onChange={e => { setVersion(e.target.value); setPreview(''); setFileError(''); }}>{row.status !== 'Draft' && <option value="current">Published version {row.version}</option>}{row.draft && <option value="draft">Proposed version {row.draft.version} · {row.draftState}</option>}{row.versions?.map(v => <option key={v.version} value={v.version}>Earlier version {v.version}</option>)}</Select></label>{row.permissions.download && <button onClick={() => download(row)}>Download selected version</button>}</div>
      {version === 'draft' && <p className="dl-notice">Draft — not approved for use.</p>}
      {version !== 'current' && version !== 'draft' && <p className="dl-notice">Earlier version — use the published version for current guidance.</p>}
      <div hidden={readerTab !== 'read'} className="dl-reader-content">{fileError && <p>{fileError}</p>}{preview ? preview.mime === 'application/pdf' ? <Suspense fallback={<p role="status">Loading PDF reader…</p>}><DocumentPdfViewer key={preview.url} src={preview.url} name={viewed?.name || row.name} /></Suspense> : <img src={preview.url} alt={viewed?.name || row.name} className="dl-image-preview" /> : !fileError && <p>Preview is loading or unavailable for this file type. CSV files can be downloaded when permitted.</p>}</div>
      <div hidden={readerTab !== 'details'} className="dl-reader-details">
      <div className="dl-metadata"><p><strong>Owner</strong>{row.ownerName || (row.uploadedBy === user._id ? user.employeeName : 'Owner not recorded')}</p><p><strong>Who can view</strong>{viewed?.audience}</p><p><strong>Effective date</strong>{date(viewed?.revisedDate)}</p><p><strong>Expiry date</strong>{date(viewed?.expiryDate)}</p></div>
      <section className="dl-reader-controls"><h3>Controls</h3><p>Reader downloads: {viewed?.allowDownload ? 'Allowed' : 'Not allowed'}</p><p>{row.visibilityMessage}</p><p className="dl-field-help">To change access, close the reader and use the document’s ••• menu → Manage access.</p></section>
      {version === 'current' && <><DocumentFeedback key={'feedback-' + row._id + row.version} document={row} /><DocumentEngagement key={row._id + row.version} document={row} approvers={approvers} onChanged={() => setRevision(value => value + 1)} /></>}
      {version === 'draft' && <DocumentEngagement reviewOnly key={row._id + '-draft'} document={row} approvers={approvers} onChanged={() => setRevision(value => value + 1)} />}
      {row.permissions.workspace && <><div className="dl-metadata"><p><strong>Assigned approver</strong>{row.approverName || approvers.find(p => p._id === row.assignedApprover)?.employeeName || (row.assignedApprover === user._id ? user.employeeName : 'Reviewer not recorded')}</p><p><strong>Review status</strong>{row.draftState || 'No revision in progress'}</p></div>
        <label>Review or archive reason<textarea maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain what needs to change, or why the document should be archived." /></label>
        <div className="dl-actions">{row.permissions.submit && <button disabled={busy} className="dl-primary" onClick={() => action(row, 'submit')}>Submit for review</button>}{row.permissions.review && <><button disabled={busy} onClick={() => action(row, 'return')}>Request changes</button><button disabled={busy} className="dl-primary" onClick={() => action(row, 'approve')}>Approve this revision</button></>}{row.permissions.publish && <button disabled={busy} className="dl-primary" onClick={() => action(row, 'publish')}>Publish approved revision</button>}{row.permissions.archive && <button disabled={busy} onClick={() => action(row, 'archive')}>Archive document</button>}</div>
        <details><summary>Document history</summary><ul>{row.history?.length ? row.history.map(entry => <li key={entry._id}><strong>{entry.action}</strong> · {entry.actorName} · {date(entry.at)} · Version {entry.version}{entry.reason && <p>{entry.reason}</p>}</li>) : <li>No earlier history was recorded for this legacy document.</li>}</ul></details>
      </>}
    </div></section></dialog>}
    {accessTarget && <DocumentAccess key={accessTarget._id} document={accessTarget} onClose={() => setAccessTarget(null)} onSaved={doc => { setDocuments(items => items.map(item => item._id === doc._id ? doc : item)); setAccessTarget(null); setNotice('Access updated. ' + doc.visibilityMessage); }} />}
    {deleteTarget && <div className="dl-overlay"><section className="dl-editor dl-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-document-title"><h2 id="delete-document-title">Delete this draft?</h2><p><strong>{deleteTarget.name}</strong></p><p>This permanently removes this unsubmitted draft. Published documents are archived instead.</p>{error && <p role="alert" className="dl-error">{error}</p>}<div className="dl-actions"><button disabled={busy} autoFocus onClick={() => setDeleteTarget(null)}>Keep document</button><button className="dl-delete" disabled={busy} onClick={() => action(deleteTarget, 'delete')}>{busy ? 'Deleting…' : 'Delete draft'}</button></div></section></div>}
    {editor && (canUpload || canManageExisting) && <DocumentEditor editor={editor} form={form} change={change} file={file} setFile={setFile} approvers={approvers} busy={busy} error={error} onClose={() => setEditor(null)} onSave={save} />}
  </div></DashboardLayout>;
}
