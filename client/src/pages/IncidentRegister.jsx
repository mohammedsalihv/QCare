import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, Download, ArrowUpRight, FileChartColumn } from 'lucide-react';
import Select from '../components/Select';
import { Search } from 'lucide-react';
import { incidentStatuses, statusInfo, incidentDate, incidentDeadline } from '../utils/incidentPresentation';
import Pagination from '../components/Pagination';
import IncidentDateField from '../components/IncidentDateField';
import { getAuthConfig } from '../utils/authConfig';
import { incidentDownload } from '../utils/incidentDownload';
import { useNotification } from '../components/NotificationContext';
import '../components/incidentWorkflow.css';

const statuses = Object.keys(incidentStatuses);
const views = {
  '': ['All incidents', 'Download any individual report here, or open it to see the next step.'],
  acceptance: ['Acceptance & triage', 'Review new reports, request clarification and assign an investigator.'],
  investigations: ['Investigations & risk', 'Record findings, root causes, operational impact and measures to prevent recurrence.'],
  actions: ['Actions & follow-up', 'Review action plans, track owners and deadlines, and record completion evidence.'],
  mine: ['Assigned to me', 'Incidents you investigate and actions assigned to you.'],
  overdue: ['Overdue work', 'Incidents with investigation deadlines or open actions past their due date.'],
  approvals: ['Closure approvals', 'Check effectiveness and remaining risk before approving closure.'],
  reports: ['Reports & downloads', 'Filter the register below, then download a summary or the matching records.']
};
export default function IncidentRegister({ view = '' }) {
  const [query, setQuery] = useState({ search: '', status: '', sortBy: 'createdAt', direction: 'desc', limit: 10, page: 1, scope: view === 'mine' ? 'mine' : '', overdue: view === 'overdue' ? 'yes' : '', queue: ['acceptance', 'investigations', 'actions', 'approvals'].includes(view) ? view : '' });
  const [result, setResult] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [exporting, setExporting] = useState(false);
  const [revision, setRevision] = useState(0);
  const { showNotification } = useNotification();
  const change = patch => setQuery(current => ({ ...current, ...patch, page: 1 }));
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const { data } = await axios.get('/api/incidents/register', { ...getAuthConfig(), params: query, signal: controller.signal });
        if (data.total && query.page > Math.ceil(data.total / query.limit)) { setQuery(q => ({ ...q, page: Math.ceil(data.total / q.limit) })); return; }
        setResult(data);
      } catch (e) { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load incidents.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, revision]);
  useEffect(() => { const refresh = () => { if (!document.hidden) setRevision(v => v + 1); }; const timer = setInterval(refresh, 30000); document.addEventListener('visibilitychange', refresh); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); }; }, []);
  const download = async (summary = false) => { setExporting(true); try { await incidentDownload(summary ? '/api/incidents/summary.pdf' : '/api/incidents/export', summary ? 'incident-summary.pdf' : 'incident-register.csv', query); } catch (e) { showNotification(e.message, 'error'); } finally { setExporting(false); } };
  const downloadReport = async row => { setExporting(true); try { await incidentDownload('/api/incidents/' + row._id + '/report.pdf', row.incidentId + '.pdf'); } catch (e) { showNotification(e.message, 'error'); } finally { setExporting(false); } };
  return <div className="iw-page iw-register">
    <header className="iw-heading"><div><span className="ir-eyebrow">INCIDENT MANAGEMENT</span><h1>{(views[view] || views[''])[0]}</h1><p>{(views[view] || views[''])[1]}</p></div></header>
    <details className="iw-status-guide"><summary>Understand every status <span>Review → Investigate → Take action → Verify → Close</span></summary><div className="iw-status-grid">{statuses.map(status => { const info = statusInfo(status); return <article key={status}><button className={'iw-status-pill iw-tone-' + info.tone} onClick={() => change({ status })}>{info.label}</button><strong>{info.stage}</strong><p>{info.meaning}</p><small>{info.next}</small></article>; })}</div></details>
    {view === 'reports' && <section className="iw-report-options" aria-label="Available reports"><article><FileChartColumn size={22}/><h2>Management summary</h2><p>PDF showing filtered totals by status, risk and category, including overdue work.</p><button className="iw-secondary" disabled={exporting} onClick={() => download(true)}>Download summary PDF</button></article><article><Download size={22}/><h2>Incident register</h2><p>Download all matching records as CSV for spreadsheets, up to 5,000 records.</p><button className="iw-secondary" disabled={exporting} onClick={() => download()}>Download register CSV</button></article><article><ClipboardList size={22}/><h2>Individual incident</h2><p>Use the PDF button on any incident below, or open it and select Download PDF for its investigation, actions, approvals and history.</p><a href="#incident-register-table">Choose an incident below</a></article></section>}
    <section className="iw-card">
      <div className="iw-register-heading"><div><h2>Incident register</h2><p>{loading ? 'Updating records…' : error ? 'Records unavailable' : result.total + ' matching incident' + (result.total === 1 ? '' : 's')} · Select a title to review the full report</p></div><div className="iw-export-actions"><button className="iw-secondary" disabled={exporting} onClick={() => download()}><Download size={15}/>Export CSV</button><button className="iw-secondary" disabled={exporting} onClick={() => download(true)}><FileChartColumn size={15}/>Summary PDF</button></div></div>
      <div className="iw-register-filters"><label className="iw-visible-search"><span>Search incidents</span><div><Search size={17}/><input type="search" maxLength={100} placeholder="Incident ID, title, branch or department" value={query.search} onChange={e => change({ search: e.target.value })}/></div></label>
        <label><span>Status</span><Select value={query.status} onChange={e => change({ status: e.target.value })}><option value="">All statuses</option>{statuses.map(status => <option value={status} key={status}>{statusInfo(status).label}</option>)}</Select></label>
        <label><span>Type</span><Select value={query.category || ''} onChange={e => change({ category: e.target.value })}><option value="">All types</option>{['Clinical','Safety','Administrative','Technical','Other'].map(type => <option key={type}>{type}</option>)}</Select></label>
        <label><span>Risk</span><Select value={query.riskLevel || ''} onChange={e => change({ riskLevel: e.target.value })}><option value="">All risks</option>{['Low','Medium','High','Critical'].map(risk => <option key={risk}>{risk}</option>)}</Select></label>
        <label><span>Sort</span><Select value={query.sortBy + ':' + query.direction} onChange={e => { const [sortBy, direction] = e.target.value.split(':'); change({ sortBy, direction }); }}><option value="createdAt:desc">Newest reported</option><option value="createdAt:asc">Oldest reported</option><option value="title:asc">Title A–Z</option><option value="status:asc">Status A–Z</option><option value="investigationDue:asc">Investigation due</option></Select></label>
        <label><span>Rows</span><Select value={query.limit} onChange={e => change({ limit: Number(e.target.value) })}>{[10,25,50,100].map(n => <option key={n}>{n}</option>)}</Select></label>
      </div>
      <details className="iw-date-filters"><summary>Incident date range</summary><div className="iw-grid"><IncidentDateField label="From" value={query.from} onChange={from => change({ from })}/><IncidentDateField label="To" value={query.to} onChange={to => change({ to })}/></div></details>
      {error && <p role="alert" className="iw-error">{error} <button onClick={() => setRevision(v => v + 1)}>Retry</button></p>}
      <div className="iw-table-wrap" id="incident-register-table" tabIndex={0} role="region" aria-label="Incident reports"><table className="iw-register-table" aria-busy={loading}><caption className="iw-sr-only">Incident IDs, workflow status, risk, ownership, deadlines and report downloads</caption><thead><tr>{['Incident / location', 'Status / next step', 'Risk / harm', 'Investigator / actions', 'Dates / deadline', 'Report'].map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="iw-empty">Loading incidents…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={6} className="iw-empty">No incidents match these filters. Change the search or status to see more records.</td></tr> : result.rows.map(row => {
          const info = statusInfo(row.status), deadline = incidentDeadline(row), actions = row.actions || [], completed = actions.filter(action => action.completedAt).length;
          return <tr key={row._id}><td><span className="iw-record-id">{row.incidentId}</span><Link className="iw-record-title" to={'/dashboard/incidents/' + row._id}>{row.title}</Link><span className="iw-type-tag">{row.category}</span><small>{row.location}{row.department ? ' · ' + row.department : ''}</small></td>
            <td><span className={'iw-status-pill iw-tone-' + info.tone}>{info.label}</span><small className="iw-stage-label">{info.stage}</small><p className="iw-row-next">{info.next}</p></td>
            <td><span className={'iw-risk-pill iw-risk-' + (row.riskLevel || 'none').toLowerCase()}>{row.riskLevel || 'Not assessed'}</span><small>Harm: {row.harmLevel || 'Unknown'}</small><small>Initial severity: {row.severity || 'Not recorded'}</small></td>
            <td><strong className="iw-owner">{row.assignedTo?.employeeName || 'Awaiting assignment'}</strong>{actions.length ? <><progress value={completed} max={actions.length} aria-label={completed + ' of ' + actions.length + ' actions completed'}/><small>{completed} of {actions.length} actions complete</small></> : <small>No actions planned yet</small>}</td>
            <td><strong className={deadline.overdue ? 'iw-overdue' : 'iw-due'}>{deadline.overdue ? 'Overdue · ' : ''}{deadline.label}</strong>{deadline.kind && <small>{deadline.kind}</small>}<small>Occurred: {incidentDate(row.dateOfIncident)}</small><small>Reported: {incidentDate(row.createdAt)}</small></td>
            <td><div className="iw-row-tools"><Link className="iw-secondary" to={'/dashboard/incidents/' + row._id} aria-label={'Open incident ' + row.incidentId}>Open<ArrowUpRight size={14}/></Link><button type="button" className="iw-secondary" disabled={exporting} aria-label={'Download PDF for ' + row.incidentId} onClick={() => downloadReport(row)}><Download size={14}/>PDF</button></div></td></tr>;
        })}
      </tbody></table></div><Pagination totalRecords={error ? 0 : result.total} recordsPerPage={query.limit} currentPage={query.page} onPageChange={page => setQuery(q => ({ ...q, page }))}/>
    </section>
  </div>;
}
