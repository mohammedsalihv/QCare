import Select from '../Select';
import React, { useState } from 'react';
import axios from 'axios';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''}` } });
const statuses = ['not-assessed', 'compliant', 'partial', 'non-compliant', 'not-applicable'];
const field = 'w-full rounded-xl border border-slate-200 p-3 bg-white';

export default function AuditWorkspace({ audit, onSaveFindings, onFinalize, readOnly = false }) {
  const criteria = audit?.criteriaSnapshot?.length ? audit.criteriaSnapshot : audit?.templateId?.criteria || [];
  const [findings, setFindings] = useState(() => criteria.map(c => audit.findings?.find(f => f.criterionId === c.criterionId) || { criterionId: c.criterionId, complianceStatus: 'not-assessed', evidence: '', exclusionReason: '', attachments: [] }));
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = findings[step];
  const update = patch => setFindings(prev => prev.map((f, i) => i === step ? { ...f, ...patch } : f));
  const assessed = findings.filter(f => f.complianceStatus !== 'not-assessed').length;
  let possible = 0, earned = 0;
  findings.forEach((f, i) => {
    if (['not-assessed', 'not-applicable'].includes(f.complianceStatus)) return;
    const weight = criteria[i]?.weight > 0 ? criteria[i].weight : 1;
    possible += weight; earned += weight * (f.complianceStatus === 'compliant' ? 1 : f.complianceStatus === 'partial' ? 0.5 : 0);
  });
  const run = async task => {
    setBusy(true); setError('');
    try { await task(); } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to save audit.'); }
    finally { setBusy(false); }
  };
  const upload = file => run(async () => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file up to 10 MB.');
    await onSaveFindings(findings);
    const data = new FormData(); data.append('file', file);
    const response = await axios.post(`/api/audit/${audit._id}/evidence/${encodeURIComponent(current.criterionId)}`, data, config());
    update({ attachments: [...(current.attachments || []), response.data.id] });
  });
  const download = id => run(async () => {
    const response = await axios.get(`/api/audit/${audit._id}/evidence/${encodeURIComponent(id)}`, { ...config(), responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a'); a.href = url; a.download = id; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  if (!criteria.length) return <div className="p-8 bg-white rounded-2xl">This audit has no checklist criteria. Select a populated template when scheduling.</div>;
  return <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="p-6 bg-slate-50 border-b flex flex-wrap justify-between gap-4">
      <div><h2 className="text-xl font-semibold">{audit.auditTitle}</h2><p>{audit.department} · {audit.standard} · {audit.status}</p></div>
      <div className="text-right"><p className="text-2xl font-semibold">{possible ? `${(earned / possible * 100).toFixed(1)}%` : 'N/A'}</p><p>{assessed}/{criteria.length} assessed · {Math.round(assessed / criteria.length * 100)}% coverage</p></div>
    </div>
    {audit.reviewComment && <p className="p-4 bg-amber-50">Reviewer feedback: {audit.reviewComment}</p>}
    <div className="p-6 space-y-5">
      <nav className="flex flex-wrap gap-2" aria-label="Audit criteria">{criteria.map((c, i) => <button key={c.criterionId} disabled={busy} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined} className={`px-3 py-2 rounded-lg border ${i === step ? 'bg-primary text-white' : findings[i]?.complianceStatus !== 'not-assessed' ? 'bg-emerald-50' : 'bg-white'}`}>{i + 1}</button>)}</nav>
      <h3 className="text-lg font-semibold">{criteria[step]?.text}</h3>
      {criteria[step]?.text_ar && <p dir="rtl">{criteria[step].text_ar}</p>}
      <p className="text-sm text-slate-600">Weight: {criteria[step]?.weight || 1}. Not applicable criteria are excluded from the compliance score.</p>
      {current && <fieldset disabled={busy || readOnly} className="space-y-4">
        <label className="block">Compliance status<Select aria-label="Compliance status" className={field} value={current.complianceStatus} onChange={e => update({ complianceStatus: e.target.value })}>{statuses.map(s => <option key={s} value={s}>{s.replaceAll('-', ' ')}</option>)}</Select></label>
        {current.complianceStatus === 'not-applicable' && <label className="block">Reason for exclusion<textarea required className={field} value={current.exclusionReason || ''} onChange={e => update({ exclusionReason: e.target.value })} /></label>}
        <label className="block">Evidence and findings<textarea className={`${field} min-h-32`} value={current.evidence || ''} onChange={e => update({ evidence: e.target.value })} placeholder="Record observations and documents reviewed." /></label>
        {!readOnly && <label className="block">Attach evidence (PDF, PNG, JPEG · up to 10 MB)<input type="file" className={field} accept="application/pdf,image/png,image/jpeg" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
      </fieldset>}
      <div className="flex flex-wrap gap-2">{current?.attachments?.map((id, i) => <button key={id} disabled={busy} className="text-blue-700 underline" onClick={() => download(id)}>Download evidence {i + 1}</button>)}</div>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-3 justify-between">
        <button disabled={busy || step === 0} onClick={() => setStep(s => s - 1)} className="px-4 py-2 border rounded-xl disabled:opacity-40">Previous</button>
        <div className="flex gap-3">{!readOnly && <><button disabled={busy} className="px-4 py-2 border rounded-xl disabled:opacity-40" onClick={() => run(() => onSaveFindings(findings))}>Save progress</button><button disabled={busy || assessed !== criteria.length} className="px-4 py-2 bg-primary text-white rounded-xl disabled:opacity-40" onClick={() => run(() => onFinalize(findings))}>Submit for review</button></>}{step < criteria.length - 1 && <button disabled={busy} className="px-4 py-2 border rounded-xl" onClick={() => setStep(s => s + 1)}>Next</button>}</div>
      </div>
    </div>
  </section>;
}
