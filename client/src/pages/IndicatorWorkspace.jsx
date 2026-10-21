import Select from '../components/Select.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Search, Settings2 } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from '../components/NotificationContext';
import IndicatorImport from '../components/kpi/IndicatorImport';
import ImportReportDetails from '../components/kpi/ImportReportDetails';
import WaitingTimeSetup from '../components/kpi/WaitingTimeSetup';

export default function IndicatorWorkspace() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const canManage = ['qualitymanager', 'superadmin', 'admin'].includes(user.role?.toLowerCase());
  const { showNotification } = useNotification();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [period, setPeriod] = useState(`Q${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [year, setYear] = useState(new Date().getFullYear());
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [view, setView] = useState('submit');
  const [entryMode, setEntryMode] = useState('upload');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/kpi', getAuthConfig());
      if (!Array.isArray(data)) throw new Error('Unexpected indicator response');
      setRecords(data);
    } catch (err) { setError(err.response?.data?.message || 'Could not load indicators. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const definitions = [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).filter((item, index, all) => all.findIndex(other => other.indicatorCode === item.indicatorCode) === index);
  const definition = definitions.find(item => item.indicatorCode === code);
  const report = records.find(item => item.indicatorCode === code && item.reportingPeriod === period && Number(item.reportingYear) === Number(year));
  const final = report && (report.submittedToDOH || ['Approved', 'Pending Approval'].includes(report.validationStatus));
  const submittedBy = report?.submittedBy || (report?.validationStatus === 'Pending Validation' ? report?.createdBy?._id || report?.createdBy : null);
  const otherSubmitter = !canManage && submittedBy && String(submittedBy) !== String(user._id);
  const validCounts = numerator !== '' && denominator !== '' && Number.isFinite(Number(numerator)) && Number(numerator) >= 0 && Number.isFinite(Number(denominator)) && Number(denominator) > 0;
  const multiplier = definition?.importRule?.multiplier || 100;
  const resultUnit = multiplier === 1 ? ' days' : multiplier === 100 ? '%' : ` per ${multiplier}`;
  const result = validCounts ? ((Number(numerator) / Number(denominator)) * multiplier).toFixed(2) : null;
  const visible = definitions.filter(item => `${item.indicatorName} ${item.indicatorCode} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  const periodRecords = records.filter(item => item.reportingPeriod === period && Number(item.reportingYear) === Number(year));
  const pending = periodRecords.filter(item => ['Pending Validation', 'Pending Approval'].includes(item.validationStatus));
  const reset = () => { setNumerator(''); setDenominator(''); setSuccess(''); setEntryMode('upload'); };
  const submit = async event => {
    event.preventDefault();
    if (!validCounts || saving || final || otherSubmitter) return;
    setSaving(true);
    setSuccess('');
    try {
      await axios.post('/api/kpi/submit-data', { indicatorCode: code, reportingPeriod: period, reportingYear: Number(year), numerator: Number(numerator), denominator: Number(denominator) }, getAuthConfig());
      reset();
      setSuccess(`${code} submitted for ${period} ${year}. It is now awaiting quality review.`);
      await load();
    } catch (err) { showNotification(err.response?.data?.message || 'Could not submit data. Your entries are retained.', 'error'); }
    finally { setSaving(false); }
  };
  const review = async item => {
    setSaving(true);
    try {
      const endpoint = item.validationStatus === 'Pending Validation' ? 'validate' : 'approve';
      await axios.post(`/api/kpi/${item._id}/${endpoint}`, endpoint === 'validate' ? { action: 'approve' } : {}, getAuthConfig());
      showNotification(endpoint === 'validate' ? 'Validated and sent for approval' : 'Report approved', 'success');
      await load();
    } catch (err) { showNotification(err.response?.data?.message || 'Review could not be saved', 'error'); }
    finally { setSaving(false); }
  };
  return <DashboardLayout><div className="qi-workspace">
    <header className="qi-heading"><div><div className="qc-eyebrow">MEASURE & IMPROVE</div><h1>Indicator workspace</h1><p>Upload source data. Review automatic counts, performance and exceptions.</p></div>{canManage && <Link to="/dashboard/indicator-settings" className="qi-settings"><Settings2 size={16} />Manage definitions</Link>}</header>
    {canManage && <WaitingTimeSetup period={period} year={year} onSaved={load} />}
    <div className="qi-toolbar"><div className="qi-views"><button className={view === 'submit' ? 'active' : ''} onClick={() => setView('submit')}>Submit data</button><button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Period reports</button>{canManage && <button className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}>Review queue ({pending.length})</button>}</div><div className="qi-period"><label>Quarter<Select aria-label="Reporting quarter" disabled={saving} value={period} onChange={event => { setPeriod(event.target.value); reset(); }}>{['Q1', 'Q2', 'Q3', 'Q4'].map(value => <option key={value}>{value}</option>)}</Select></label><label>Year<input aria-label="Reporting year" disabled={saving} type="number" min="2000" max="2100" value={year} onChange={event => { setYear(event.target.value); reset(); }} /></label></div></div>
    {error && <div className="qi-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
    {success && <div className="qi-success" role="status"><CheckCircle2 size={19} />{success}</div>}
    {loading ? <div className="qi-empty" role="status">Loading indicators...</div> : !error && view === 'submit' ? <div className="qi-entry-grid">
      <section className="qi-picker"><div className="qc-eyebrow">1 / CHOOSE AN INDICATOR</div><div className="qi-search"><Search size={17} /><input aria-label="Search indicators" placeholder="Search by name or code" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="qi-indicator-list">{visible.map(item => <button disabled={saving} key={item.indicatorCode} className={code === item.indicatorCode ? 'selected' : ''} onClick={() => { setCode(item.indicatorCode); reset(); }}><small>{item.indicatorCode}</small><strong>{item.indicatorName}</strong><span>{item.category}<ArrowRight size={15} /></span></button>)}{!visible.length && <p className="qi-empty">{definitions.length ? 'No matching indicators.' : 'No indicators configured yet. The quality team can add definitions.'}</p>}</div></section>
      <section className="qi-entry">{definition ? <><div className="qc-eyebrow">2 / UPLOAD & REVIEW DATA</div><h2>{definition.indicatorName}</h2><p className="qi-entry-meta">{code} / {period} {year} {report ? ` / ${report.validationStatus}` : '/ Not yet submitted'}</p>{definition.description && <p className="qi-description">{definition.description}</p>}
        {final || otherSubmitter ? <div className="qi-notice">{final ? 'This report is under approval or finalized. Contact the quality team for a correction.' : 'Another colleague submitted this period. Contact the quality team for a correction.'}</div> : <><div className="qi-entry-modes"><button type="button" disabled={saving} className={entryMode === 'upload' ? 'active' : ''} onClick={() => setEntryMode('upload')}>Upload source data</button><button type="button" disabled={saving || Boolean(definition.importRule?.preset)} className={entryMode === 'manual' ? 'active' : ''} onClick={() => setEntryMode('manual')}>Manual fallback</button></div>{entryMode === 'upload' ? <IndicatorImport key={`${code}-${period}-${year}`} definition={definition} period={period} year={year} canManage={canManage} onBusyChange={setSaving} onSaved={async message => { setSuccess(message); await load(); }} /> : <form onSubmit={submit}><div className="qi-counts"><label>Numerator<small>{definition.numeratorDesc || 'Number of qualifying cases or events'}</small><input type="number" min="0" step="any" required disabled={saving} value={numerator} onChange={event => setNumerator(event.target.value)} placeholder="Enter count" /></label><label>Denominator<small>{definition.denominatorDesc || 'Total eligible cases or population'}</small><input type="number" min="0" step="any" required disabled={saving} value={denominator} onChange={event => setDenominator(event.target.value)} placeholder="Enter total" /></label></div>
        {denominator !== '' && Number(denominator) <= 0 && <p className="qi-validation" role="alert">The denominator must be greater than zero.</p>}
        <div className="qi-calculation" aria-live="polite"><div><span>Calculated result</span><strong>{result === null ? '--' : `${result}${resultUnit}`}</strong></div><p>Numerator / denominator x {multiplier}<br />Calculated using the configured indicator formula.</p></div><p className="qi-entry-help">Your report goes to the quality team for validation. Indicator definitions and targets stay unchanged.</p><button className="qi-submit" disabled={!validCounts || saving || !year || Number(year) < 2000 || Number(year) > 2100} type="submit">{saving ? 'Submitting...' : report ? 'Resubmit for validation' : 'Submit for validation'}<ArrowRight size={17} /></button></form>}</>}
        {report && <div className="qi-previous"><strong>Existing period record</strong><span>{report.numerator} / {report.denominator} = {report.calculatedValue}{report.unit === 'days' ? ' days' : (report.calculationRule?.multiplier || 100) === 100 ? '%' : ` per ${report.calculationRule.multiplier}`}</span>{!final && !otherSubmitter && !definition.importRule?.preset && <button type="button" disabled={saving} onClick={() => { setEntryMode('manual'); setNumerator(String(report.numerator)); setDenominator(String(report.denominator)); }}>Use these counts to make a correction</button>}<ImportReportDetails report={report} />{report.rejectionReason && <p>Review feedback: {report.rejectionReason}</p>}</div>}
      </> : <div className="qi-empty"><h2>Start with your indicator</h2><p>Select a measure on the left. Its instructions and data entry fields will appear here.</p></div>}</section>
    </div> : !error && <section className="qi-reports"><div className="qc-section-heading"><h2>{view === 'review' ? 'Reports awaiting review' : `Reports for ${period} ${year}`}</h2><span>{view === 'review' ? pending.length : periodRecords.length} records</span></div>{(view === 'review' ? pending : periodRecords).map(item => <article key={item._id}><div><small>{item.indicatorCode}</small><h3>{item.indicatorName}</h3><p>{item.importSummary ? 'Spreadsheet-derived' : 'Manual / existing record'}</p><p>{item.numerator} / {item.denominator} = {item.calculatedValue}{item.unit === 'days' ? ' days' : (item.calculationRule?.multiplier || 100) === 100 ? '%' : ` per ${item.calculationRule.multiplier}`}</p><ImportReportDetails report={item} /></div><span className="qi-report-status">{item.validationStatus}</span>{view === 'review' && canManage && <button disabled={saving} onClick={() => review(item)}>{item.validationStatus === 'Pending Validation' ? 'Validate' : 'Approve'}</button>}</article>)}{!(view === 'review' ? pending : periodRecords).length && <p className="qi-empty">No reports in this view for the selected period.</p>}</section>}
  </div></DashboardLayout>;
}
