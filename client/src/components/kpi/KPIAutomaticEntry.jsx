import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';
import { valueLabel } from '../../utils/kpiDisplay';

const newCase = () => ({ key: crypto.randomUUID(), recordId: '', date: '', outcome: '', reason: '', department: '' });
export default function KPIAutomaticEntry({ definition, report, period, year, canManage, onSaved, onBusyChange }) {
  const [sources, setSources] = useState([]);
  const [rule, setRule] = useState(() => ({ source: 'cases', ward: '', auditType: '', measureType: 'compliance', ...definition.automaticRule }));
  const [cases, setCases] = useState(() => report?.importSummary?.caseObservations?.length ? report.importSummary.caseObservations.map(row => ({ ...row, key: crypto.randomUUID() })) : [newCase()]);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    let active = true;
    axios.get('/api/kpi/automatic/sources', getAuthConfig()).then(({ data }) => { if (active) setSources(data); }).catch(() => { if (active) setError('Could not load calculation sources. Reopen this indicator to try again.'); });
    return () => { active = false; };
  }, []);
  const configured = definition.automaticRule?.source;
  const eventMeasure = definition.automaticRule?.measureType === 'event';
  const invalidate = () => { setPreview(null); setConfirmed(false); setError(''); };
  const working = value => { setBusy(value); onBusyChange(value); };
  const changeCase = (key, field, value) => { invalidate(); setCases(previous => previous.map(row => row.key === key ? { ...row, [field]: value } : row)); };
  const saveRule = async event => {
    event.preventDefault(); working(true); invalidate();
    try {
      await axios.put(`/api/kpi/automatic/rule/${encodeURIComponent(definition.indicatorCode)}`, rule, getAuthConfig());
      await onSaved('Automatic source configured. Review the population, then calculate the report.');
    } catch (err) { setError(err.response?.data?.message || 'Could not save the source rule.'); }
    finally { working(false); }
  };
  const analyze = async event => {
    event.preventDefault(); working(true); invalidate();
    try {
      const { data } = await axios.post('/api/kpi/automatic/preview', { indicatorCode: definition.indicatorCode, reportingPeriod: period, reportingYear: Number(year), ...(configured === 'cases' ? { cases: cases.map(row => ({ recordId: row.recordId, date: row.date, outcome: row.outcome, reason: row.reason, department: row.department })) } : {}) }, getAuthConfig());
      setPreview(data);
    } catch (err) { setError(err.response?.data?.message || 'Could not calculate the source records. Your observations are retained.'); }
    finally { working(false); }
  };
  const submit = async () => {
    if (!confirmed || !preview?.token || busy) return;
    working(true); setError('');
    try {
      await axios.post('/api/kpi/submit-data', { indicatorCode: definition.indicatorCode, reportingPeriod: period, reportingYear: Number(year), importToken: preview.token }, getAuthConfig());
      setPreview(null); setConfirmed(false);
      await onSaved(`${definition.indicatorCode}: calculated report submitted for quality validation.`);
    } catch (err) { setError(err.response?.data?.message || 'Could not submit the calculated report.'); }
    finally { working(false); }
  };
  const summary = preview?.summary;
  const source = sources.find(item => item.id === configured);
  return <div className="ki-automatic">
    <div className="ki-auto-intro"><strong>QCare calculates the totals</strong><p>Use the selected KPI population and counting rule. Review the source coverage and calculated analysis before sending it for validation.</p></div>
    {canManage && <details className="qi-rule-editor" open={!configured}><summary>{configured ? 'View or change automatic source' : 'Configure automatic calculation'}</summary>
      <form className="ki-form" onSubmit={saveRule}><fieldset disabled={busy}><div className="ki-form-grid">
        <label>Source<select value={rule.source} onChange={event => { invalidate(); setRule(previous => ({ ...previous, source: event.target.value })); }}>{sources.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{sources.find(item => item.id === rule.source)?.description}</small></label>
        {rule.source === 'cases' ? <label>What does a matching outcome mean?<select value={rule.measureType} onChange={event => { invalidate(); setRule(previous => ({ ...previous, measureType: event.target.value })); }}><option value="compliance">Compliant / requirement met</option><option value="event">Defined event occurred</option></select><small>Numerator = matching eligible observations. Denominator = all eligible observations. This does not estimate exposure totals such as patient-days.</small></label> : <label>Ward scope<input value={rule.ward} maxLength={150} placeholder="Blank includes all wards" onChange={event => { invalidate(); setRule(previous => ({ ...previous, ward: event.target.value })); }} /><small>Exact ward label as stored in source records. Confirm this scope matches the KPI definition.</small></label>}
        {rule.source === 'medication-audit' && <label>Audit type<select value={rule.auditType} onChange={event => { invalidate(); setRule(previous => ({ ...previous, auditType: event.target.value })); }}><option value="">All audit types</option>{['storage', 'labeling', 'high-alert', 'expiry-check', 'controlled-substance'].map(type => <option key={type}>{type}</option>)}</select></label>}
      </div></fieldset><p>Source records must represent the population described by this KPI. Clinical eligibility and exclusions must be reviewed by the data owner.</p><button className="qi-submit" disabled={busy || !sources.length}>Save source rule</button></form>
    </details>}
    {!configured ? <p className="qi-notice">The quality team must select a source and confirm the counting rule once. Staff can then calculate reports without entering numerator or denominator totals.</p> : <form className="ki-form" onSubmit={analyze}>
      <div className="ki-definition-note"><strong>{source?.label || configured}</strong><span>{source?.description}</span><span>Population: {definition.denominatorDesc || 'All eligible observations'}</span><span>Numerator: {definition.numeratorDesc || 'Matching eligible observations'}</span>{configured !== 'cases' && <span>Ward: {definition.automaticRule.ward || 'All wards'}{definition.automaticRule.auditType ? ` / ${definition.automaticRule.auditType}` : ''}. Reporting dates use Dubai time.</span>}</div>
      {configured === 'cases' && <fieldset disabled={busy}><legend>Enter individual observations</legend><p>Use anonymous references, not patient names or MRNs. Enter one observation per case; mark exclusions using the KPI definition. No counting is needed.</p>
        <div className="ki-case-list">{cases.map((row, index) => <div className="ki-case-card" key={row.key}><div className="ki-section-head"><strong>Observation {index + 1}</strong><button className="qi-settings" type="button" disabled={cases.length === 1} onClick={() => { invalidate(); setCases(previous => previous.filter(item => item.key !== row.key)); }}>Remove</button></div><div className="ki-form-grid">
          <label>Anonymous case reference<input required maxLength={100} value={row.recordId} onChange={event => changeCase(row.key, 'recordId', event.target.value)} placeholder="e.g. AUDIT-001" /></label>
          <label>Observation date<input required type="date" value={row.date} onChange={event => changeCase(row.key, 'date', event.target.value)} /></label>
          <label>Outcome<select required value={row.outcome} onChange={event => changeCase(row.key, 'outcome', event.target.value)}><option value="">Select outcome</option><option value="yes">{eventMeasure ? 'Defined event occurred' : 'Requirement met'}</option><option value="no">{eventMeasure ? 'Defined event did not occur' : 'Requirement not met'}</option><option value="excluded">Excluded under KPI definition</option></select></label>
          <label>Department / specialty<input maxLength={150} value={row.department} onChange={event => changeCase(row.key, 'department', event.target.value)} /></label>
          <label>{row.outcome === 'excluded' ? 'Exclusion reason' : 'Exception reason category'}<input required={row.outcome === 'excluded'} maxLength={120} value={row.reason} onChange={event => changeCase(row.key, 'reason', event.target.value)} placeholder="Short category, if applicable" /></label>
        </div></div>)}</div><button type="button" className="qi-settings" disabled={cases.length >= 500} onClick={() => { invalidate(); setCases(previous => [...previous, newCase()]); }}>Add observation</button>
      </fieldset>}
      <button className="qi-submit" disabled={busy}>{busy ? 'Calculating…' : configured === 'cases' ? 'Calculate observations' : 'Calculate from QCare records'}</button>
    </form>}
    {error && <p className="qi-error" role="alert">{error}</p>}
    {summary && <section className="ki-auto-analysis" aria-label="Automatic KPI analysis" aria-live="polite"><div className="qc-eyebrow">CALCULATED FROM SOURCE RECORDS</div><div className="qi-import-metrics">{[['Numerator', summary.numerator], ['Denominator', summary.denominator], ['Performance', valueLabel(summary.calculatedValue, definition)], ['Target gap', summary.analysis.gap === null ? 'Not assessed' : valueLabel(summary.analysis.gap, definition)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <p>{summary.totalRows} source observations · {summary.excluded} excluded · {summary.outsidePeriod} outside this period · {summary.invalidRows} invalid.</p><p><strong>{summary.analysis.targetMet === null ? 'Performance cannot be assessed yet.' : summary.analysis.targetMet ? 'Target met' : 'Target not met'}</strong> · {summary.analysis.status.replaceAll('-', ' ')}</p>
      {summary.nonComplianceCount !== null && <p>Non-compliance: {summary.nonComplianceCount} ({summary.nonCompliancePercent ?? '—'}%).</p>}
      {!!summary.invalidRows && <div className="qi-error"><div>Correct the source records before submitting.<ul>{summary.issues.map((issue, index) => <li key={index}>Observation {issue.row}: {issue.message}</li>)}</ul></div></div>}
      {!summary.denominator && <p className="qi-notice">No eligible observations were found. QCare will not treat missing data as successful performance.</p>}
      {summary.departments.length > 0 && <div className="ki-table-scroll"><table><caption>Department / specialty performance</caption><thead><tr><th scope="col">Department / specialty</th><th scope="col">Numerator</th><th scope="col">Denominator</th><th scope="col">Performance</th><th scope="col">Non-compliance</th></tr></thead><tbody>{summary.departments.map(item => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.numerator}</td><td>{item.denominator}</td><td>{valueLabel(item.calculatedValue, definition)}</td><td>{item.nonComplianceCount ?? '—'}</td></tr>)}</tbody></table></div>}
      {summary.reasons.length > 0 && <div className="ki-auto-reasons"><h3>{eventMeasure ? 'Recorded event categories' : 'Recorded non-compliance categories'}</h3>{summary.reasons.map(item => <p key={item.label}>{item.label}: <strong>{item.count}</strong> ({item.percentageOfExceptions}% of exceptions)</p>)}</div>}
      {summary.analysis.suggestions.length > 0 && <div className="ki-auto-suggestions"><h3>Suggested improvement follow-up</h3><p>Suggestions use the observed results. The quality team confirms causes, assigns owners and sets due dates in Improvement actions.</p><ul>{summary.analysis.suggestions.map(item => <li key={item}>{item}</li>)}</ul></div>}
      {summary.canSubmit && <><label className="qi-import-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I confirm this source covers the correct KPI population and {period} {year}. The totals and analysis have been reviewed.</label><button type="button" className="qi-submit" disabled={busy || !confirmed} onClick={submit}>Submit calculated report for validation</button></>}
    </section>}
  </div>;
}
