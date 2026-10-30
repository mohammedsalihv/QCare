import React, { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, Layers3, ListChecks, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import Select from '../Select';
import { useNotification } from '../NotificationContext';
import { StandardBadge, StatusBadge } from './AuditBadges';
import { displayLabel } from './auditPresentation';

const standards = ['internal', 'ADHICS', 'Jawda', 'ADMCC', 'DOH', 'JCI', 'ISO'];
const blankCriteria = () => [{ criterionId: 'C1', text: '', weight: 1 }];
export default function AuditTemplateManager({ onCreate, onUpdate, onDelete, templates, canManage }) {
  const { confirm } = useNotification();
  const form = useRef(null), nameInput = useRef(null);
  const [editorOpen, setEditorOpen] = useState(false), [editing, setEditing] = useState(null);
  const [name, setName] = useState(''), [standard, setStandard] = useState('internal'), [customStandard, setCustomStandard] = useState('');
  const [pillar, setPillar] = useState('clinical-audit'), [criteria, setCriteria] = useState(blankCriteria);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [search, setSearch] = useState(''), [filter, setFilter] = useState('');
  const reset = () => { setEditing(null); setEditorOpen(false); setName(''); setStandard('internal'); setCustomStandard(''); setPillar('clinical-audit'); setCriteria(blankCriteria()); setError(''); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' })); };
  const openEditor = template => {
    setEditing(template || null); setEditorOpen(true); setError('');
    setName(template?.templateName || ''); setPillar(template?.governancePillar || 'clinical-audit');
    setStandard(template && !standards.includes(template.standard) ? '__other__' : template?.standard || 'internal');
    setCustomStandard(template && !standards.includes(template.standard) ? template.standard : '');
    setCriteria(template ? template.criteria.map(c => ({ ...c, weight: c.weight || 1 })) : blankCriteria());
    requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: 'instant' }); nameInput.current?.focus({ preventScroll: true }); });
  };
  const addCriterion = () => setCriteria(previous => {
    const used = new Set(previous.map(c => c.criterionId)); let number = 1;
    while (used.has(`C${number}`)) number++;
    return [...previous, { criterionId: `C${number}`, text: '', weight: 1 }];
  });
  const remove = template => confirm({ title: 'Delete audit template?', message: `Delete “${template.templateName}” from the template library? Audits already using it will keep their saved checklist.`, type: 'danger', confirmLabel: 'Delete template', onConfirm: async () => {
    setBusy(true); setError('');
    try { await onDelete(template); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Unable to delete template.'); }
    finally { setBusy(false); }
  } });
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    const values = { templateName: name.trim(), standard: standard === '__other__' ? customStandard.trim() : standard, governancePillar: pillar, criteria: criteria.map(c => ({ criterionId: c.criterionId, text: c.text.trim(), text_ar: c.text_ar, weight: Number(c.weight) })) };
    try {
      if (editing) await onUpdate(editing._id, { ...values, expectedVersion: editing.__v || 0 });
      else await onCreate(values);
      reset();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to save template.'); }
    finally { setBusy(false); }
  };
  const filtered = templates.filter(t => (!filter || t.standard === filter) && `${t.templateName} ${t.standard} ${t.governancePillar}`.toLowerCase().includes(search.toLowerCase()));
  const errorMessage = error && <p role="alert" className="ca-alert">{error}</p>;
  if (editorOpen && canManage) return <form ref={form} onSubmit={submit} className="ca-template-editor">
    <button type="button" disabled={busy} className="ca-text-button" onClick={reset}><ArrowLeft size={15} />Back to templates</button>
    <div className="ca-editor-heading"><div><p className="ca-eyebrow">Template builder</p><h2>{editing ? 'Edit audit template' : 'New audit template'}</h2><p>{editing ? 'Refine the checklist for future audits. Existing audit records keep their original criteria.' : 'Create a clear, consistent checklist for your clinic’s audit programme.'}</p></div>{editing && <StatusBadge status="active" />}</div>
    {errorMessage}
    <section className="ca-panel"><div className="ca-panel-heading"><div className="ca-section-title"><span className="ca-section-index">01</span><h3>Template details</h3></div><FileText size={20} /></div><fieldset disabled={busy} className="ca-editor-settings ca-form">
      <label>Template name<input ref={nameInput} required className="ca-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Patient safety and clinical documentation" /></label>
      <div className="ca-form-grid"><label>Standard<Select aria-label="Standard" disabled={busy} className="ca-input" value={standard} onChange={event => setStandard(event.target.value)}>{standards.map(s => <option key={s}>{s}</option>)}<option value="__other__">Other standard…</option></Select></label><label>Governance pillar<Select aria-label="Governance pillar" disabled={busy} className="ca-input" value={pillar} onChange={event => setPillar(event.target.value)}>{['clinical-risk', 'clinical-audit', 'effectiveness-outcomes', 'training', 'staff-management', 'patient-involvement', 'information-management'].map(p => <option key={p} value={p}>{displayLabel(p)}</option>)}</Select></label></div>
      {standard === '__other__' && <label>Standard name<input required maxLength={100} className="ca-input" value={customStandard} onChange={event => setCustomStandard(event.target.value)} placeholder="Enter the applicable standard" /></label>}
    </fieldset></section>
    <section className="ca-panel"><div className="ca-panel-heading"><div className="ca-section-title"><span className="ca-section-index">02</span><div><h3>Checklist criteria</h3><p className="ca-small">Describe what the auditor must assess and assign a scoring weight.</p></div></div><span className="ca-count">{criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}</span></div><fieldset disabled={busy}>
      <div className="ca-criteria-list ca-form">{criteria.map((criterion, index) => <div key={criterion.criterionId} className="ca-criterion-editor"><span className="ca-section-index">{String(index + 1).padStart(2, '0')}</span><label>Criterion {index + 1}<textarea aria-label={`Criterion ${index + 1}`} required className="ca-input" value={criterion.text} placeholder="Describe the requirement to be assessed…" onChange={event => setCriteria(previous => previous.map((c, i) => i === index ? { ...c, text: event.target.value } : c))} /></label><label>Weight<input required type="number" min="0.01" step="0.01" className="ca-input" value={criterion.weight} onChange={event => setCriteria(previous => previous.map((c, i) => i === index ? { ...c, weight: event.target.value } : c))} /></label><button type="button" aria-label={`Remove criterion ${index + 1}`} disabled={criteria.length === 1} onClick={() => setCriteria(previous => previous.filter((_, i) => i !== index))}><Trash2 size={16} /></button></div>)}</div>
      <button type="button" disabled={criteria.length >= 200} className="ca-button ca-secondary ca-criteria-add" onClick={addCriterion}><Plus size={16} />Add criterion</button>
    </fieldset><div className="ca-form-footer"><p className="ca-small"><CheckCircle2 size={13} style={{ display: 'inline', marginRight: 5 }} />Existing audits retain their saved checklists.</p><div className="ca-button-row"><button type="button" disabled={busy} className="ca-button ca-secondary" onClick={reset}>{editing ? 'Cancel editing' : 'Cancel'}</button><button disabled={busy} className="ca-button ca-primary"><Save size={15} />{busy ? 'Saving…' : editing ? 'Save changes' : 'Save template'}</button></div></div></section>
  </form>;
  return <div className="ca-stack">
    <header className="ca-library-heading"><div><p className="ca-eyebrow">Reusable checklists</p><h2>Template library</h2><p>Your clinic’s standards and checklists, ready for every audit.</p></div>{canManage && <button className="ca-button ca-primary" onClick={() => openEditor(null)}><Plus size={17} />New template</button>}</header>
    {errorMessage}
    <div className="ca-toolbar ca-library-tools"><label className="ca-search"><Search size={17} /><input aria-label="Search templates" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a template or standard…" />{search && <button aria-label="Clear template search" onClick={() => setSearch('')}><X size={14} /></button>}</label><Select aria-label="Filter templates by standard" className="ca-filter" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All standards</option>{[...new Set(templates.map(t => t.standard))].sort().map(s => <option key={s}>{s}</option>)}</Select><span className="ca-count">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</span></div>
    {!filtered.length ? <section className="ca-panel ca-empty"><span className="ca-empty-icon"><Layers3 size={28} /></span><h3>{templates.length ? 'No matching templates' : 'No active audit templates.'}</h3><p>{templates.length ? 'Try a different name or standard.' : 'Build a checklist once and use it to guide every audit.'}</p></section> : <div className="ca-template-grid">{filtered.map(template => <article key={template._id} className="ca-template-card"><div className="ca-template-card-top"><span className="ca-template-icon"><ClipboardCheck size={23} /></span><StatusBadge status="active" /></div><div><h3>{template.templateName}</h3><StandardBadge standard={template.standard} /><p className="ca-template-preview">{template.criteria[0]?.text || 'Reusable audit checklist'}</p>{template.guidance && <p className="ca-template-guidance">{template.guidance} {template.sourceUrl && <a href={template.sourceUrl} target="_blank" rel="noreferrer">Reference guidance ↗</a>}</p>}<div className="ca-template-meta"><span><ListChecks size={13} />{template.criteria.length} {template.criteria.length === 1 ? 'criterion' : 'criteria'}</span><span><Layers3 size={12} />{displayLabel(template.governancePillar)}</span></div></div>{canManage && <footer className="ca-template-card-footer"><button type="button" disabled={busy} aria-label={`Edit template ${template.templateName}`} className="ca-button ca-secondary ca-compact" onClick={() => openEditor(template)}><Pencil size={13} />Edit template</button><button type="button" disabled={busy} aria-label={`Delete template ${template.templateName}`} className="ca-button ca-danger ca-compact" onClick={() => remove(template)}><Trash2 size={13} />Delete</button></footer>}</article>)}</div>}
  </div>;
}
