import { useEffect, useState } from 'react';
import axios from 'axios';
import Select from './Select';
import UserSelect from './UserSelect';
import IncidentDateField from './IncidentDateField';
import { getAuthConfig } from '../utils/authConfig';
import './PrivilegeApplication.css';

const empty = { staffId: '', specialty: '', applicationType: 'new', privilegeType: 'core', reason: '', requestedStartDate: '', expiryDate: '', assignedApprover: '' };
const levels = { 'independent': 'Independent', 'direct-supervision': 'Direct supervision', 'indirect-supervision': 'Indirect supervision' };
export default function PrivilegeApplication({ reviewQueue = false }) {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const role = String(user.role || '').toLowerCase();
  const reviewer = role === 'qualitymanager' || String(user.designation || '').trim().replace(/\s+/g, ' ').toLowerCase() === 'medical director';
  const onBehalf = reviewer || ['admin', 'superadmin'].includes(role);
  const [form, setForm] = useState({ ...empty, staffId: user._id || '' });
  const [clinicianName, setClinicianName] = useState(user.employeeName || 'Your signed-in account');
  const [procedures, setProcedures] = useState([{ name: '', level: 'independent' }]);
  const [files, setFiles] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState({});
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([axios.get('/api/cp/privileges/options', { ...getAuthConfig(), signal: controller.signal }), axios.get(reviewQueue ? '/api/cp/privileges' : '/api/cp/privileges/mine', { ...getAuthConfig(), signal: controller.signal })]).then(([options, applications]) => {
      setApprovers(options.data.approvers); setRows(applications.data); setError('');
    }).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load applications. Please retry.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reviewQueue, revision]);
  const check = () => {
    if (!form.staffId || !form.specialty.trim() || !form.reason.trim() || !form.assignedApprover) return 'Complete the clinician, specialty, reason and approver.';
    if (!form.requestedStartDate || !form.expiryDate || form.expiryDate <= form.requestedStartDate) return 'Choose a start date and an end date after it.';
    if (!procedures.length || procedures.some(p => !p.name.trim())) return 'Enter every requested procedure, or remove unused rows.';
    if (new Set(procedures.map(p => p.name.trim().toLowerCase())).size !== procedures.length) return 'Remove duplicate procedures.';
    return '';
  };
  const submit = async () => {
    const issue = check(); if (issue) { setError(issue); setStep(1); return; }
    setBusy(true); setError('');
    const body = new FormData(); body.append('payload', JSON.stringify({ ...form, procedures })); files.forEach(file => body.append('documents', file));
    try {
      const { data } = await axios.post('/api/cp/privileges', body, getAuthConfig());
      setRows(previous => [data, ...previous]); setNotice('Application saved and awaiting approval. Requested dates do not grant permission to practise.');
      setForm({ ...empty, staffId: user._id || '' }); setClinicianName(user.employeeName || 'Your signed-in account'); setProcedures([{ name: '', level: 'independent' }]); setFiles([]); setStep(1);
    } catch (e) { setError(e.response?.data?.message || 'Application was not submitted. Your entries are retained; please retry.'); } finally { setBusy(false); }
  };
  const download = async (row, document) => {
    try {
      const { data } = await axios.get(`/api/cp/privileges/${row._id}/documents/${document._id}`, { ...getAuthConfig(), responseType: 'blob' });
      const url = URL.createObjectURL(data); const a = window.document.createElement('a'); a.href = url; a.download = document.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Unable to download this document. Please retry.'); }
  };
  const decide = async (row, decision) => {
    if (decision === 'reject' && !notes[row._id]?.trim()) { setError('Add a review reason before rejecting.'); return; }
    setBusy(true); setError('');
    try { await axios.put(`/api/cp/privileges/${row._id}/approve`, { decision, reviewNotes: notes[row._id] || '' }, getAuthConfig()); setRevision(value => value + 1); setNotice(`Application ${decision === 'approve' ? 'approved' : 'rejected'}.`); }
    catch (e) { setError(e.response?.data?.message || 'Unable to save this decision.'); } finally { setBusy(false); }
  };
  return <div className="privilege-application">
    <header><p className="pa-eyebrow">Clinical privileges</p><h2>{reviewQueue ? 'Application reviews' : 'Apply for clinical privileges'}</h2><p>{reviewQueue ? 'Review the requested scope, justification, dates and supporting evidence.' : 'Explain the clinical scope you need and send it to an authorised reviewer.'}</p></header>
    {error && <div className="pa-error" role="alert">{error} <button type="button" onClick={() => setRevision(value => value + 1)}>Reload applications</button></div>}
    {notice && <p className="pa-notice" role="status">{notice}</p>}
    {!reviewQueue && <>
      <ol className="pa-steps"><li aria-current={step === 1 ? 'step' : undefined}>1 · Application details</li><li aria-current={step === 2 ? 'step' : undefined}>2 · Review & submit</li></ol>
      <form onSubmit={e => { e.preventDefault(); const issue = check(); setError(issue); if (!issue) { setStep(2); setNotice(''); } }}>
        <fieldset disabled={busy || loading} hidden={step !== 1}>
          <section><h3>Who & why</h3><div className="pa-grid">
            <div><label>Clinician *</label>{onBehalf ? <UserSelect aria-label="Clinician" value={form.staffId} selectedLabel={user.employeeName} onChange={e => { set('staffId', e.target.value); setClinicianName(e.target.selectedOptions[0]?.text || ''); set('assignedApprover', ''); }} /> : <p>{user.employeeName || 'Your signed-in account'}</p>}</div>
            <label>Application type<Select value={form.applicationType} onChange={e => set('applicationType', e.target.value)}><option value="new">New privileges</option><option value="renewal">Renew existing privileges</option><option value="extension">Extend clinical scope</option></Select></label>
            <label>Clinical specialty *<input required maxLength={150} value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="e.g. General dentistry" /></label>
            <label>Privilege type<Select value={form.privilegeType} onChange={e => set('privilegeType', e.target.value)}><option value="core">Core</option><option value="special">Special</option><option value="emergency">Emergency</option></Select></label>
          </div><label>Why are these privileges needed? *<textarea required maxLength={4000} rows={4} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Describe the service need, relevant training and experience, and why you are applying or renewing." /></label></section>
          <section><h3>Which procedures?</h3><p>List the exact procedures or activities and the supervision you are requesting.</p>
            {procedures.map((procedure, index) => <div className="pa-procedure" key={index}><label>Procedure {index + 1} *<input required maxLength={300} value={procedure.name} onChange={e => setProcedures(procedures.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} /></label><label>Supervision<Select value={procedure.level} onChange={e => setProcedures(procedures.map((p, i) => i === index ? { ...p, level: e.target.value } : p))}>{Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><button type="button" disabled={procedures.length === 1} aria-label={`Remove procedure ${index + 1}`} onClick={() => setProcedures(procedures.filter((_, i) => i !== index))}>Remove</button></div>)}
            <button type="button" disabled={procedures.length >= 50} onClick={() => setProcedures([...procedures, { name: '', level: 'independent' }])}>+ Add procedure</button>
          </section>
          <section><h3>When & who approves?</h3><div className="pa-grid"><IncidentDateField label="Requested start date" required value={form.requestedStartDate} onChange={value => set('requestedStartDate', value)} /><IncidentDateField label="Requested end date" required value={form.expiryDate} onChange={value => set('expiryDate', value)} /></div>
            <label>Assigned approver *<Select aria-label="Assigned approver" value={form.assignedApprover} onChange={e => set('assignedApprover', e.target.value)}><option value="">Select an authorised reviewer</option>{approvers.filter(p => p._id !== form.staffId).map(p => <option value={p._id} key={p._id}>{p.employeeName} · {String(p.designation || '').trim().toLowerCase() === 'medical director' ? 'Medical Director' : 'Quality Manager'}</option>)}</Select></label>
            <p>Approval authority: Medical Director or Quality Manager. The applicant and submitter cannot approve their own request.</p>
          </section>
          <section><h3>Supporting documents <span>Optional</span></h3><p>Attach relevant licences, training certificates, procedure logs or signed forms. PDF, JPG or PNG; up to 5 files, 5 MB each and 10 MB combined.</p>
            <label className="pa-upload">Choose supporting documents<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
              const next = [...files, ...Array.from(e.target.files || [])]; e.target.value = '';
              if (next.length > 5 || next.some(f => f.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) || next.reduce((sum, f) => sum + f.size, 0) > 10 * 1024 * 1024) { setError('Choose PDF, JPG or PNG files within the stated limits.'); return; }
              setFiles(next); setError('');
            }} /></label>
            <ul>{files.map((file, index) => <li key={index}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</button></li>)}</ul>
          </section><footer><span>* Required fields</span><button className="pa-primary" type="submit">Review application</button></footer>
        </fieldset>
        {step === 2 && <section><h3>Review your application</h3><p><strong>Clinician:</strong> {clinicianName}</p><p><strong>{form.applicationType} · {form.privilegeType} · {form.specialty}</strong></p><p>{form.reason}</p><ul>{procedures.map((p, i) => <li key={i}>{p.name} — {levels[p.level]}</li>)}</ul><p>Requested period: {form.requestedStartDate} to {form.expiryDate}</p><p>Approver: {approvers.find(p => p._id === form.assignedApprover)?.employeeName}</p><p>Documents: {files.map(f => f.name).join(', ') || 'No documents attached'}</p><p>Submission requests approval; it does not grant clinical privileges.</p><footer><button type="button" disabled={busy} onClick={() => setStep(1)}>Back to edit</button><button className="pa-primary" type="button" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit application'}</button></footer></section>}
      </form>
    </>}
    <section><h3>{reviewQueue ? 'Saved applications' : 'My submitted applications'}</h3>{loading ? <p>Loading applications…</p> : !rows.length && <p>No applications found.</p>}
      {rows.map(row => <details key={row._id}><summary><strong>{row.staffId?.employeeName || 'Clinician'} · {row.specialty}</strong><span>{row.status.replaceAll('-', ' ')}</span></summary>
        <p>{row.applicationType || 'Application'} · {row.privilegeType}</p><p><strong>Reason:</strong> {row.reason || 'Not recorded in this older application'}</p><p><strong>Requested dates:</strong> {row.requestedStartDate?.slice(0, 10) || 'Not recorded'} to {row.expiryDate?.slice(0, 10)}</p><p><strong>Assigned approver:</strong> {row.assignedApprover?.employeeName || 'Not assigned'}</p>
        <ul>{row.procedures.map((p, i) => <li key={i}>{p.name} · {levels[p.level]}</li>)}</ul>
        <p><strong>Supporting documents:</strong> {!row.supportingDocuments?.length && 'None attached'}</p>{row.supportingDocuments?.map(d => <button type="button" key={d._id} onClick={() => download(row, d)}>{d.name}</button>)}
        {row.reviewNotes && <p><strong>Reviewer notes:</strong> {row.reviewNotes}</p>}
        {reviewQueue && reviewer && row.status === 'pending-approval' && row.staffId?._id !== user._id && row.requestedBy !== user._id && (!row.assignedApprover || row.assignedApprover?._id === user._id) && <div><label>Review notes (required to reject)<textarea value={notes[row._id] || ''} onChange={e => setNotes({ ...notes, [row._id]: e.target.value })} /></label><footer><button type="button" disabled={busy} onClick={() => decide(row, 'reject')}>Reject application</button><button type="button" className="pa-primary" disabled={busy} onClick={() => decide(row, 'approve')}>Approve requested scope</button></footer></div>}
      </details>)}
    </section>
  </div>;
}
