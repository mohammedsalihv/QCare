import Select from '../Select.jsx';
import { useState } from 'react';
import { Upload, CheckCircle2, Download } from 'lucide-react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';

const blankRule = { aggregationMode: 'rows', numeratorColumn: '', denominatorColumn: '', outcomeColumn: '', matchingValues: ['yes'], otherValues: ['no'], eligibilityColumn: '', eligibleValues: ['yes'], excludedValues: ['no'], idColumn: '', dateColumn: '', reasonColumn: '', riskColumn: '', measureType: 'compliance', multiplier: 100, targetDirection: 'higher' };
const list = value => value.split(',');
const unit = multiplier => Number(multiplier) === 1 ? ' days' : Number(multiplier) === 100 ? '%' : ` per ${multiplier}`;

export default function IndicatorImport({ definition, period, year, canManage, onSaved, onBusyChange }) {
  const preset = definition.waitingTimePreset;
  const [rule, setRule] = useState(() => ({ ...blankRule, ...definition.importRule }));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const configured = Boolean(definition.importRule?.preset || definition.importRule?.outcomeColumn || definition.importRule?.numeratorColumn);
  const setWorking = value => { setBusy(value); onBusyChange(value); };
  const saveRule = async event => {
    event.preventDefault();
    setWorking(true); setError('');
    try {
      await axios.put(`/api/kpi/import/rule/${encodeURIComponent(definition.indicatorCode)}`, rule, getAuthConfig());
      await onSaved('Spreadsheet rule saved. Upload your source data to analyze it.');
    } catch (err) { setError(err.response?.data?.message || 'Could not save the counting rule.'); }
    finally { setWorking(false); }
  };
  const analyze = async () => {
    setWorking(true); setError(''); setPreview(null); setConfirmed(false); setMessage('');
    try {
      const form = new FormData();
      form.append('file', file); form.append('indicatorCode', definition.indicatorCode);
      form.append('reportingPeriod', period); form.append('reportingYear', year);
      const { data } = await axios.post('/api/kpi/import/preview', form, getAuthConfig());
      setPreview(data);
    } catch (err) { setError(err.response?.data?.message || 'Could not analyze this file. Check the file format and try again.'); }
    finally { setWorking(false); }
  };
  const submit = async () => {
    if (!preview?.token || !confirmed || busy) return;
    setWorking(true); setError('');
    try {
      await axios.post('/api/kpi/submit-data', { indicatorCode: definition.indicatorCode, reportingPeriod: period, reportingYear: Number(year), importToken: preview.token }, getAuthConfig());
      setMessage('Uploaded data submitted for quality validation.');
      setPreview(null);
      await onSaved(`${definition.indicatorCode}: uploaded data submitted for ${period} ${year}.`);
    } catch (err) { setError(err.response?.data?.message || 'Submission failed. Your preview is retained.'); }
    finally { setWorking(false); }
  };
  const template = () => {
    const fields = ['idColumn', 'dateColumn', 'eligibilityColumn', ...(definition.importRule.aggregationMode === 'totals' ? ['numeratorColumn', 'denominatorColumn'] : ['outcomeColumn']), 'reasonColumn', 'riskColumn'];
    const headers = preset ? preset.columns : [...new Set(fields.map(key => definition.importRule[key]).filter(Boolean))];
    const csv = headers.map(header => `"${header.replaceAll('"', '""')}"`).join(',') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'indicator-data-template.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const update = event => setRule(prev => ({ ...prev, [event.target.name]: event.target.value }));
  return <div className="qi-import">
    <p className="qi-description">{preset ? 'Upload source records to calculate the DOH numerator, denominator and result automatically.' : "Upload your data. QCare counts records or sums numeric totals using the quality team's saved rule."}</p>
    {preset && <div className="qi-notice"><div><strong>DOH v9.1 · Page {preset.page}</strong><p>Numerator: {preset.numeratorDesc}</p><p>Denominator: {preset.denominatorDesc}</p><p>Source population: {preset.population}</p><p>Set population_eligible to yes/no after clinical review. Set exclusion_reason to none or one of: {preset.exclusions.join(', ') || 'none (no exclusions)'}. Use one row per encounter/observation and unique record_id; omit names and MRNs.</p><p>reporting_date assigns the row to the selected quarter. Use ISO date-times (Abu Dhabi +04:00 by default) and YYYY-MM-DD dates. Blank required data blocks submission.</p>{preset.kind === 'sepsis' && <p>Use not_done for treatment confirmed not performed; unknown or blank treatment data is invalid. Arrival is the earlier of registration and triage.</p>}{preset.kind === 'return' && <p>Supply index encounters only, with repeats marked repeat_within_7_days. next_return_at is the first return after discharge; leave blank only when seven-day follow-up confirms no return. Set followup_complete to yes after checking the full seven days, including the next quarter.</p>}{preset.kind === 'appointment' && <p>Supply observations for all three months, using the same weekday/time for sampling. Today = 0 days. The quarterly result averages the three monthly means and is reported in days.</p>}</div></div>}
    {preset && <details className="qi-rule-editor"><summary>Read source population, diagnosis codes and exclusions</summary><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.875rem' }}>{preset.sourceGuidance}</pre></details>}
    {canManage && !preset && <details className="qi-rule-editor" open={!configured}><summary>{configured ? 'View or change the counting rule' : 'Set up automatic counting once'}</summary><form onSubmit={saveRule}>
      <p>Use row counting for individual observations, or numeric totals for exported event counts and exposure totals such as patient-days. Set the population and outcome rules from the indicator definition. Risk labels summarize exceptions; they do not determine the formula.</p>
      <div className="qi-rule-grid">
        <label>Source data layout<Select name="aggregationMode" value={rule.aggregationMode || 'rows'} onChange={update}><option value="rows">Individual observation rows</option><option value="totals">Numeric counts / exposure totals</option></Select></label>
        {rule.aggregationMode === 'totals' ? <><label>Numerator totals column<input required name="numeratorColumn" value={rule.numeratorColumn || ''} onChange={update} placeholder="e.g. event_count" /></label><label>Denominator totals column<input required name="denominatorColumn" value={rule.denominatorColumn || ''} onChange={update} placeholder="e.g. patient_days" /></label></> : <>
        <label>Outcome column<input required name="outcomeColumn" value={rule.outcomeColumn || ''} onChange={update} placeholder="e.g. compliant" /></label>
        <label>Numerator outcome values<input required value={(rule.matchingValues || []).join(',')} onChange={event => setRule(prev => ({ ...prev, matchingValues: list(event.target.value) }))} placeholder="e.g. yes, compliant" /></label>
        <label>Other valid outcome values<input required value={(rule.otherValues || []).join(',')} onChange={event => setRule(prev => ({ ...prev, otherValues: list(event.target.value) }))} placeholder="e.g. no, noncompliant" /></label>
        </>}
        <label>Measure type<Select name="measureType" value={rule.measureType || 'compliance'} onChange={update}><option value="compliance">Compliance: matching = compliant</option><option value="event">Event rate: matching = event occurred</option></Select></label>
        <label>Multiplier<Select name="multiplier" value={rule.multiplier || 100} onChange={update}><option value="100">100 (percentage)</option><option value="1000">1,000 (rate)</option><option value="10000">10,000 (rate)</option></Select></label>
        <label>Target direction<Select name="targetDirection" value={rule.targetDirection || 'higher'} onChange={update}><option value="higher">Higher is better</option><option value="lower">Lower is better</option></Select></label>
        <label>Eligibility column (optional)<input name="eligibilityColumn" value={rule.eligibilityColumn || ''} onChange={update} placeholder="Blank = every row eligible" /></label>
        {rule.eligibilityColumn && <><label>Included eligibility values<input required value={(rule.eligibleValues || []).join(',')} onChange={event => setRule(prev => ({ ...prev, eligibleValues: list(event.target.value) }))} /></label><label>Excluded eligibility values<input required value={(rule.excludedValues || []).join(',')} onChange={event => setRule(prev => ({ ...prev, excludedValues: list(event.target.value) }))} /></label></>}
        <label>Unique record ID column (optional)<input name="idColumn" value={rule.idColumn || ''} onChange={update} placeholder="e.g. observation_id" /></label>
        <label>Date column (optional)<input name="dateColumn" value={rule.dateColumn || ''} onChange={update} placeholder="YYYY-MM-DD or Excel date cells" /></label>
        <label>Reason category column (optional)<input name="reasonColumn" value={rule.reasonColumn || ''} onChange={update} placeholder="Category labels, not narrative text" /></label>
        <label>Risk category column (optional)<input name="riskColumn" value={rule.riskColumn || ''} onChange={update} placeholder="Existing risk labels in source" /></label>
      </div><button type="submit" disabled={busy} className="qi-submit">Save counting rule</button>
    </form></details>}
    {!configured ? <div className="qi-notice">A quality manager or administrator must configure how this indicator counts spreadsheet rows before uploads can be analyzed.</div> : <>
      <div className="qi-import-rule-note"><strong>How this file will be counted</strong>{preset ? <p>{preset.kind === 'appointment' ? 'Quarterly average in days; no percentage.' : 'Performance = numerator ÷ denominator × 100.'} Clinical exclusions are applied before counting. {preset.target === null ? 'No numeric benchmark is specified.' : `Target: ${preset.targetDirection === 'lower' ? (preset.targetStrict ? '<' : '≤') : '≥'} ${preset.target}%.`}</p> : <p>{definition.importRule.aggregationMode === 'totals' ? <>Numerator: sum of {definition.importRule.numeratorColumn}. Denominator: sum of {definition.importRule.denominatorColumn}.</> : <>Numerator: {definition.importRule.outcomeColumn} matches {(definition.importRule.matchingValues || []).join(' / ')}. Denominator: count of eligible rows.</>}<br />Population: {definition.importRule.eligibilityColumn ? `rows where ${definition.importRule.eligibilityColumn} matches ${(definition.importRule.eligibleValues || []).join(' / ')}` : 'all valid rows in the file'}. Multiplier: {definition.importRule.multiplier}. {definition.importRule.targetDirection === 'lower' ? 'Lower' : 'Higher'} meets the target.</p>}<button type="button" onClick={template}><Download size={15} />Download column template</button></div>
      <label className="qi-upload-box"><Upload size={27} /><strong>Choose indicator source data</strong><span>CSV or XLSX / one populated sheet / up to 5 MB and 50,000 rows</span><input type="file" accept=".csv,.xlsx" disabled={busy} onChange={event => { const next = event.target.files?.[0]; setPreview(null); setConfirmed(false); setError(''); if (next && next.size > 5 * 1024 * 1024) { setFile(null); setError('Choose a file smaller than 5 MB.'); return; } setFile(next || null); }} /></label>
      <button type="button" className="qi-submit" disabled={!file || busy} onClick={analyze}>{busy ? 'Working...' : 'Analyze uploaded data'}</button>
    </>}
    {error && <div className="qi-error" role="alert">{error}</div>}{message && <div className="qi-success" role="status">{message}</div>}
    {preview && <section className="qi-import-preview" aria-label="Upload analysis"><div className="qc-eyebrow">REVIEW BEFORE SUBMITTING</div><div className="qi-import-metrics">{[['Source rows', preview.summary.totalRows], ['Numerator', preview.summary.numerator], ['Denominator', preview.summary.denominator], ['Result', preview.summary.calculatedValue === null ? '--' : `${preview.summary.calculatedValue}${unit(preview.rule.multiplier)}`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <p>{preview.summary.excluded} excluded / {preview.summary.outsidePeriod} outside period / {preview.summary.invalidRows} invalid rows.</p>
      {preview.summary.nonComplianceCount !== null && <p><strong>Non-compliance: {preview.summary.nonComplianceCount} ({preview.summary.nonCompliancePercent ?? '--'}%).</strong></p>}
      <p>{preview.target === null ? 'No numeric target specified in the guidance.' : `Target: ${preset?.targetStrict ? '< ' : ''}${preview.target}${unit(preview.rule.multiplier)}. ${preview.targetMet === null ? 'Not assessed.' : preview.targetMet ? 'Target met.' : 'Target not met.'}`}</p>
      {preview.summary.waitingStatistics && <p>Waiting time ({preview.summary.waitingStatistics.unit}; {preview.summary.waitingStatistics.count} measured durations): mean {preview.summary.waitingStatistics.mean}, median {preview.summary.waitingStatistics.median}, minimum {preview.summary.waitingStatistics.min}, maximum {preview.summary.waitingStatistics.max}.</p>}
      {preview.summary.monthly?.map(m => <p key={m.month}>Month {m.month}: {m.meanDays.toFixed(2)} days ({m.observations} observations).</p>)}
      {preview.summary.warnings.map(warning => <p className="qi-notice" key={warning}>{warning}</p>)}
      {preview.summary.invalidRows > 0 && <div className="qi-error"><div><strong>Correct the source file and analyze again.</strong><ul>{preview.summary.issues.map(issue => <li key={issue.row}>Row {issue.row}: {issue.message}</li>)}</ul>{preview.summary.invalidRows > 30 && <p>Showing the first 30 issues.</p>}</div></div>}
      {!preview.summary.denominator && <p className="qi-notice">No valid eligible records were found for this period.</p>}
      {preview.summary.reasons.length > 0 && <div><h3>{preview.rule.measureType === 'compliance' ? 'Non-compliance reasons' : 'Event reasons'}</h3>{preview.summary.reasons.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}</div>}
      {preview.summary.risks.length > 0 && <div><h3>Exception risk labels from source</h3>{preview.summary.risks.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}<small>These are recorded source labels, not an automated clinical risk assessment.</small></div>}
      {preview.summary.canSubmit && <><label className="qi-import-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I reviewed the counts and confirm this file covers {period} {year} and the correct indicator population.</label><button type="button" className="qi-submit" disabled={!confirmed || busy} onClick={submit}><CheckCircle2 size={17} />Submit calculated report for validation</button></>}
    </section>}
  </div>;
}
