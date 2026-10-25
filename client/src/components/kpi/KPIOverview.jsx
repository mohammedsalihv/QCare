import { isOverdue, periodOrder, statusLabel, targetLabel, valueLabel } from '../../utils/kpiDisplay';

export default function KPIOverview({ definitions, records, period, year, canManage, onNavigate, onSelect }) {
  const selectedOrder = Number(year) * 4 + Number(period.slice(1));
  const expected = definitions.filter(item => periodOrder(item) <= selectedOrder);
  const reports = records.filter(item => item.reportingPeriod === period && Number(item.reportingYear) === Number(year));
  const missing = expected.filter(item => !reports.some(report => report.indicatorCode === item.indicatorCode && report.validationStatus !== 'Draft'));
  const approved = reports.filter(item => item.validationStatus === 'Approved');
  const attention = approved.filter(item => ['at-risk', 'breached'].includes(item.status));
  const pending = reports.filter(item => ['Pending Validation', 'Pending Approval'].includes(item.validationStatus));
  const overdue = records.flatMap(item => (item.improvementActions || []).filter(isOverdue));
  const stats = [
    ['Indicators to report', expected.length, 'submit'],
    ['Missing or returned', missing.length, 'submit'],
    ['Awaiting review', pending.length, canManage ? 'review' : 'reports'],
    ['Approved reports', approved.length, 'reports'],
    ['Need improvement', attention.length, 'reports'],
    ['Overdue actions · all periods', overdue.length, 'actions'],
  ];
  return <div className="ki-stack">
    <section className="ki-intro"><div><span className="qc-eyebrow">YOUR NEXT STEP</span><h2>{!definitions.length ? 'Start with one meaningful indicator' : missing.length ? 'Complete your quarterly reporting' : pending.length ? 'Your reports are ready for review' : 'Review results and follow through'}</h2><p>{!definitions.length ? 'Define what you measure, who owns it, how to calculate it and the target your team has agreed.' : 'Choose an indicator, enter its counts or upload a spreadsheet, then send the result for quality review.'}</p></div><button className="qi-settings" onClick={() => onNavigate(!definitions.length && canManage ? 'setup' : 'submit')}>{!definitions.length && canManage ? 'Set up an indicator' : 'Enter results'}</button></section>
    <div className="ki-metrics">{stats.map(([label, value, destination]) => <button key={label} onClick={() => onNavigate(destination)}><span>{label}</span><strong>{value}</strong><small>View details →</small></button>)}</div>
    <div className="ki-columns"><section className="ki-panel"><h2>Reporting checklist · {period} {year}</h2><p>Expected indicators are those first configured by this quarter. Drafts and returned reports still need submission.</p>{missing.length ? <ul className="ki-list">{missing.map(item => <li key={item.indicatorCode}><div><strong>{item.indicatorName}</strong><small>{item.indicatorCode} · {item.owner || 'Owner not assigned'}</small></div><button className="qi-settings" onClick={() => onSelect(item.indicatorCode)}>Enter data</button></li>)}</ul> : <div className="qi-empty">{expected.length ? 'All expected indicators have been submitted.' : 'No indicators expected for this quarter.'}</div>}</section>
    <section className="ki-panel"><h2>Approved results needing attention</h2><p>Performance is shown only after approval. Different measurement units are kept separate.</p>{attention.length ? <ul className="ki-list">{attention.map(item => <li key={item._id}><div><strong>{item.indicatorName}</strong><small>{valueLabel(item.calculatedValue, item)} · Target {targetLabel(item)}</small><span className={'ki-badge ' + item.status}>{statusLabel(item.status)}</span></div><button className="qi-settings" onClick={() => onNavigate('actions')}>Actions</button></li>)}</ul> : <div className="qi-empty">{approved.length ? 'No approved results need attention in this quarter.' : 'Approved results will appear here after review.'}</div>}</section></div>
  </div>;
}
