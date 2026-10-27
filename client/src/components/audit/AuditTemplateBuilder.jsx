import Select from '../Select';
import React, { useState } from 'react';
const input = 'w-full border border-slate-200 rounded-xl p-3 bg-white';
export default function AuditTemplateBuilder({ onCreate, templates, canManage }) {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('internal');
  const [customStandard, setCustomStandard] = useState('');
  const [pillar, setPillar] = useState('clinical-audit');
  const [criteria, setCriteria] = useState([{ text: '', weight: 1 }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await onCreate({ templateName: name, standard: standard === '__other__' ? customStandard.trim() : standard, governancePillar: pillar, criteria: criteria.map((c, i) => ({ criterionId: `C${i + 1}`, text: c.text.trim(), weight: Number(c.weight) })) });
      setName(''); setCriteria([{ text: '', weight: 1 }]);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5"><div className="grid md:grid-cols-2 gap-4">{templates.map(t => <article key={t._id} className="p-5 bg-white border rounded-2xl"><h2 className="font-semibold">{t.templateName}</h2><p>{t.standard} · {t.criteria?.length || 0} criteria</p></article>)}</div>
    {canManage && <form onSubmit={submit} className="p-6 bg-white border rounded-2xl space-y-4"><h2 className="text-lg font-semibold">Create checklist template</h2><p className="text-sm text-slate-600">Choose criteria approved for your clinic. A standard label does not certify regulatory compliance.</p>
      <fieldset disabled={busy} className="space-y-4"><label className="block">Template name<input required className={input} value={name} onChange={e => setName(e.target.value)} /></label>
      <div className="grid sm:grid-cols-2 gap-4"><label>Standard<Select aria-label="Standard" className={input} value={standard} onChange={e => setStandard(e.target.value)}>{['internal', 'ADHICS', 'Jawda', 'ADMCC', 'DOH', 'JCI', 'ISO'].map(s => <option key={s}>{s}</option>)}<option value="__other__">Other standard…</option></Select></label><label>Governance pillar<Select className={input} value={pillar} onChange={e => setPillar(e.target.value)}>{['clinical-risk', 'clinical-audit', 'effectiveness-outcomes', 'training', 'staff-management', 'patient-involvement', 'information-management'].map(p => <option key={p}>{p}</option>)}</Select></label></div>
      {standard === '__other__' && <label className="block">Standard name<input required maxLength={100} className={input} value={customStandard} onChange={e => setCustomStandard(e.target.value)} placeholder="Enter the applicable standard" /></label>}
      {criteria.map((c, i) => <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 items-end"><label>Criterion {i + 1}<textarea required className={input} value={c.text} onChange={e => setCriteria(prev => prev.map((item, index) => index === i ? { ...item, text: e.target.value } : item))} /></label><label>Weight<input required type="number" min="0.01" step="0.01" className={input} value={c.weight} onChange={e => setCriteria(prev => prev.map((item, index) => index === i ? { ...item, weight: e.target.value } : item))} /></label><button type="button" aria-label={`Remove criterion ${i + 1}`} disabled={criteria.length === 1} onClick={() => setCriteria(prev => prev.filter((_, index) => index !== i))} className="p-3 disabled:opacity-40">×</button></div>)}
      <button type="button" disabled={criteria.length >= 200} className="border rounded-xl px-4 py-2" onClick={() => setCriteria(prev => [...prev, { text: '', weight: 1 }])}>+ Add criterion</button>
      {error && <p role="alert" className="text-rose-700">{error}</p>}<button className="block bg-primary text-white rounded-xl px-4 py-2">Save template</button></fieldset>
    </form>}
    {!templates.length && !canManage && <p>No audit templates available. Contact a quality manager.</p>}
  </div>;
}
