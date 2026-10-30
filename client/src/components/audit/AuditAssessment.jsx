import React, { useState } from 'react';
import axios from 'axios';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Download, FileCheck2, Paperclip, Save } from 'lucide-react';
import Select from '../Select';
import { StandardBadge, StatusBadge } from './AuditBadges';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''}` } });
const statuses = ['not-assessed', 'compliant', 'partial', 'non-compliant', 'not-applicable'];

export default function AuditAssessment({ audit, onSaveFindings, onFinalize, readOnly = false }) {
  const criteria = audit?.criteriaSnapshot?.length ? audit.criteriaSnapshot : audit?.templateId?.criteria || [];
  const [findings, setFindings] = useState(() => criteria.map(c => audit.findings?.find(f => f.criterionId === c.criterionId) || { criterionId: c.criterionId, complianceStatus: 'not-assessed', evidence: '', exclusionReason: '', attachments: [] }));
  const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const current = findings[step];
  const update = patch => setFindings(previous => previous.map((f, index) => index === step ? { ...f, ...patch } : f));
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
    const url = URL.createObjectURL(response.data), a = document.createElement('a'); a.href = url; a.download = id; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  if (!criteria.length) return <section className="ca-panel ca-empty"><FileCheck2 size={30} /><h3>No checklist criteria</h3><p>This audit needs a populated template before assessment can begin.</p></section>;
  return <section className="ca-panel"><header className="ca-assessment-header"><div><p className="ca-eyebrow">Evidence & assessment</p><h2>{audit.auditTitle}</h2><div className="ca-assessment-meta"><StandardBadge standard={audit.standard} /><span>{readOnly ? 'Read-only assessment' : 'Work through each criterion and record your evidence.'}</span></div></div><div className="ca-assessment-score"><strong>{possible ? `${(earned / possible * 100).toFixed(1)}%` : '—'}</strong><span>Running compliance</span></div></header>
    <div className="ca-assessment-progress"><span><strong>{assessed}</strong> of {criteria.length} criteria assessed</span><div className="ca-progress-track"><span style={{ width: `${assessed / criteria.length * 100}%` }} /></div><small>{Math.round(assessed / criteria.length * 100)}% coverage</small></div>
    {audit.reviewComment && <p className="ca-review-feedback">Reviewer feedback: {audit.reviewComment}</p>}
    <div className="ca-assessment-grid"><nav className="ca-criteria-nav" aria-label="Audit criteria"><p className="ca-eyebrow">Checklist</p>{criteria.map((criterion, index) => <button key={criterion.criterionId} disabled={busy} onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined} className={findings[index]?.complianceStatus !== 'not-assessed' ? 'is-assessed' : ''}><span>{findings[index]?.complianceStatus !== 'not-assessed' ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><small>{criterion.text}</small></button>)}</nav>
      <div className="ca-assessment-main"><div className="ca-question-heading"><span className="ca-count">Criterion {step + 1} of {criteria.length}</span><StatusBadge status={current?.complianceStatus || 'not-assessed'} /></div><h3 className="ca-question">{criteria[step]?.text}</h3>{criteria[step]?.text_ar && <p dir="rtl" className="ca-question-ar">{criteria[step].text_ar}</p>}<p className="ca-small">Scoring weight: {criteria[step]?.weight || 1}. Excluded criteria do not reduce the compliance score.</p>
        {current && <fieldset disabled={busy || readOnly} className="ca-form"><label>Compliance status<Select aria-label="Compliance status" disabled={busy || readOnly} className="ca-input" value={current.complianceStatus} onChange={event => update({ complianceStatus: event.target.value })}>{statuses.map(s => <option key={s} value={s}>{s.replaceAll('-', ' ')}</option>)}</Select></label>
          {current.complianceStatus === 'not-applicable' && <label>Reason for exclusion<textarea required className="ca-input" value={current.exclusionReason || ''} onChange={event => update({ exclusionReason: event.target.value })} /></label>}
          <label>Evidence and findings<textarea aria-label="Evidence and findings" className="ca-input ca-evidence-input" value={current.evidence || ''} onChange={event => update({ evidence: event.target.value })} placeholder="Record observations, documents reviewed or conversations with staff…" /></label>
          {!readOnly && <label className="ca-upload"><Paperclip size={22} /><strong>Attach evidence</strong><span>PDF, PNG or JPEG · up to 10 MB</span><input aria-label="Attach evidence" type="file" accept="application/pdf,image/png,image/jpeg" onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label>}
        </fieldset>}
        {current?.attachments?.length > 0 && <div className="ca-attachment-list">{current.attachments.map((id, index) => <button key={id} disabled={busy} onClick={() => download(id)}><Download size={14} />Download evidence {index + 1}</button>)}</div>}
        {error && <p role="alert" className="ca-alert">{error}</p>}
      </div>
    </div>
    <footer className="ca-form-footer"><button disabled={busy || step === 0} onClick={() => setStep(previous => previous - 1)} className="ca-button ca-secondary"><ChevronLeft size={15} />Previous</button><div className="ca-button-row">{!readOnly && <><button disabled={busy} className="ca-button ca-secondary" onClick={() => run(() => onSaveFindings(findings))}><Save size={15} />Save progress</button><button disabled={busy || assessed !== criteria.length} className="ca-button ca-primary" onClick={() => run(() => onFinalize(findings))}><CheckCircle2 size={15} />Submit for review</button></>}{step < criteria.length - 1 && <button disabled={busy} className="ca-button ca-secondary" onClick={() => setStep(previous => previous + 1)}>Next<ChevronRight size={15} /></button>}</div></footer>
  </section>;
}
