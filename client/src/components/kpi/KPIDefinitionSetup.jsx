import { useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';

export default function KPIDefinitionSetup({ period, year, onSaved, onCancel }) {
  const [form, setForm] = useState({ indicatorCode: '', indicatorName: '', category: 'patient-safety', owner: '', dataSource: '', description: '', numeratorDesc: '', denominatorDesc: '', exclusions: '', target: '', unit: '%', multiplier: '100', targetDirection: 'higher', warningTolerance: '0' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const field = (name, label, help, required = true) => <label>{label}<small>{help}</small><input name={name} value={form[name]} onChange={update} required={required} maxLength={name === 'indicatorCode' ? 50 : 500} /></label>;
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { multiplier, targetDirection, warningTolerance, ...definition } = form;
      await axios.post('/api/kpi', { ...definition, indicatorCode: form.indicatorCode.trim().toUpperCase(), reportingPeriod: period, reportingYear: Number(year), reportingFrequency: 'Quarterly', target: Number(form.target), calculationRule: { multiplier: Number(multiplier), targetDirection, warningTolerance: Number(warningTolerance) } }, getAuthConfig());
      await onSaved(form.indicatorCode.trim().toUpperCase());
    } catch (err) { setError(err.response?.data?.message || 'Could not save the indicator. Your entries are retained.'); }
    finally { setBusy(false); }
  };
  return <section className="ki-panel"><h2>Set up an indicator</h2><p>Define the measure once. Department staff then report against the same definition each quarter. First reporting period: {period} {year}.</p>
    <form className="ki-form" onSubmit={save}><fieldset disabled={busy}><legend>1. What are you measuring?</legend><div className="ki-form-grid">
      {field('indicatorName', 'Indicator name', 'Use a clear name staff will recognize.')}{field('indicatorCode', 'Unique code', 'For example, QUALITY-001. Use a new code for a different measure.')}
      <label>Category<select name="category" value={form.category} onChange={update}><option value="patient-safety">Patient safety</option><option value="clinical-effectiveness">Clinical effectiveness</option><option value="patient-experience">Patient experience</option><option value="efficiency">Efficiency</option><option value="access">Access</option></select></label>
      {field('owner', 'Responsible owner / department', 'Who collects the data and follows up on performance?')}
      {field('dataSource', 'Data source', 'For example, an audit register or department report.')}{field('description', 'Purpose', 'Explain what this measure helps your team improve.')}
    </div></fieldset><fieldset disabled={busy}><legend>2. How is it calculated?</legend><div className="ki-form-grid">
      {field('numeratorDesc', 'Numerator: what to count', 'Describe the qualifying cases, events or total duration.')}{field('denominatorDesc', 'Denominator: eligible total', 'Describe the population, opportunities or observations.')}
      {field('exclusions', 'Exclusions and counting rules', 'Describe records to leave out and how to handle duplicates.', false)}
      <label>Calculation scale<small>Result = numerator ÷ denominator × scale.</small><select name="multiplier" value={form.multiplier} onChange={event => setForm(previous => ({ ...previous, multiplier: event.target.value, unit: event.target.value === '100' ? '%' : event.target.value === '1' ? 'days' : 'per ' + event.target.value }))}><option value="100">Percentage (× 100)</option><option value="1">Average / ratio (× 1)</option><option value="1000">Rate per 1,000</option><option value="10000">Rate per 10,000</option></select></label>
      {field('unit', 'Display unit', 'For example: %, days, minutes, or per 1000.')}
    </div></fieldset><fieldset disabled={busy}><legend>3. What does good performance look like?</legend><div className="ki-form-grid">
      <label>Agreed target<small>Use the target approved by your quality team.</small><input name="target" type="number" min="0" step="any" value={form.target} onChange={update} required /></label>
      <label>Better performance means<select name="targetDirection" value={form.targetDirection} onChange={update}><option value="higher">Higher result (at or above target)</option><option value="lower">Lower result (at or below target)</option></select></label>
      <label>Near-target warning tolerance<small>Distance from target in the same unit; 0 means any missed target is below target performance.</small><input name="warningTolerance" type="number" min="0" step="any" value={form.warningTolerance} onChange={update} required /></label>
    </div></fieldset>{error && <p className="qi-error" role="alert">{error}</p>}<div className="ki-buttons"><button className="qi-settings" type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className="qi-submit" disabled={busy || !Number.isInteger(Number(year)) || year < 2000 || year > 2100}>{busy ? 'Saving…' : 'Save indicator'}</button></div></form></section>;
}
