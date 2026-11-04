import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, Download, ArrowUpRight, FileChartColumn } from 'lucide-react';
import ListToolbar from '../components/ListToolbar';
import Pagination from '../components/Pagination';
import IncidentDateField from '../components/IncidentDateField';
import { getAuthConfig } from '../utils/authConfig';
import { incidentDownload } from '../utils/incidentDownload';
import { useNotification } from '../components/NotificationContext';
import '../components/incidentWorkflow.css';

const statuses = ['Pending', 'Needs clarification', 'Accepted', 'Investigating', 'Action in progress', 'Closure review', 'Closed', 'Rejected', 'Duplicate', 'Reopened', 'Resolved'];
const views = {
  training: ['Dummy incidents', 'Fictional records for practising the workflow. Excluded from live incident totals; no staff notifications are sent.'],
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
  const [query, setQuery] = useState({ demo: view === 'training' ? 'only' : '', search: '', status: '', sortBy: 'createdAt', direction: 'desc', limit: 10, page: 1, scope: view === 'mine' ? 'mine' : '', overdue: view === 'overdue' ? 'yes' : '', queue: ['acceptance', 'investigations', 'actions', 'approvals'].includes(view) ? view : '' });
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
  return <div className="iw-page">
    <header className="iw-heading"><div><span className="ir-eyebrow">INCIDENT MANAGEMENT</span><h1>{(views[view] || views[''])[0]}</h1><p>{(views[view] || views[''])[1]}</p></div></header>
    {view === '' && <section className="iw-feature-guide" aria-label="Incident workflow"><div><strong>1. Accept & assign</strong><p>Review the report and choose an investigator.</p></div><div><strong>2. Investigate & assess</strong><p>Find the cause, assess risk and operational impact.</p></div><div><strong>3. Act & follow up</strong><p>Assign prevention actions and record completion.</p></div><div><strong>4. Verify & close</strong><p>Review effectiveness and approve closure.</p></div></section>}
    {view === 'reports' && <section className="iw-report-options" aria-label="Available reports"><article><FileChartColumn size={22}/><h2>Management summary</h2><p>PDF showing filtered totals by status, risk and category, including overdue work.</p><button className="iw-secondary" disabled={exporting} onClick={() => download(true)}>Download summary PDF</button></article><article><Download size={22}/><h2>Incident register</h2><p>Download all matching records as CSV for spreadsheets, up to 5,000 records.</p><button className="iw-secondary" disabled={exporting} onClick={() => download()}>Download register CSV</button></article><article><ClipboardList size={22}/><h2>Individual incident</h2><p>Use the PDF button on any incident below, or open it and select Download PDF for its investigation, actions, approvals and history.</p><a href="#incident-register-table">Choose an incident below</a></article></section>}
    <Link className="iw-secondary" to="/dashboard/incidents?view=demo">Explore a demo incident from report to closure</Link>
    <section className="iw-card">
      <div className="iw-toolbar"><ListToolbar list={{ query, change }} searchLabel="Search reference, title, branch or department" statuses={statuses} sorts={[{ value: 'createdAt', label: 'Reported date' }, { value: 'title', label: 'Title' }, { value: 'status', label: 'Status' }, { value: 'investigationDue', label: 'Investigation deadline' }]} extraFilters={[{ key: 'riskLevel', label: 'Risk level', allLabel: 'All risk levels', options: ['Low', 'Medium', 'High', 'Critical'] }, { key: 'category', label: 'Category', allLabel: 'All categories', options: ['Clinical', 'Safety', 'Administrative', 'Technical', 'Other'] }]}/><button type="button" className="iw-icon" disabled={exporting} title="Download filtered register (CSV)" aria-label="Download filtered register (CSV)" onClick={() => download()}><Download size={18}/></button><button type="button" className="iw-icon" disabled={exporting} title="Download summary PDF" aria-label="Download summary PDF" onClick={() => download(true)}><FileChartColumn size={18}/></button></div>
      <details className="iw-date-filters"><summary>Incident date range</summary><div className="iw-grid"><IncidentDateField label="From" value={query.from} onChange={from => change({ from })}/><IncidentDateField label="To" value={query.to} onChange={to => change({ to })}/></div></details>
      {error && <p role="alert" className="iw-error">{error} <button onClick={() => setRevision(v => v + 1)}>Retry</button></p>}
      <div className="iw-table-wrap" id="incident-register-table"><table aria-busy={loading}><thead><tr>{['S/N', 'Incident', 'Branch / department', 'Status', 'Risk', 'Investigator', 'Next deadline', ''].map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={8} className="iw-empty">Loading incidents…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={8} className="iw-empty">No incidents match these filters.</td></tr> : result.rows.map((row, index) => <tr key={row._id}><td>{(query.page - 1) * query.limit + index + 1}</td><td><Link to={'/dashboard/incidents/' + row._id}>{row.title}</Link><small>{row.incidentId}</small></td><td>{row.location}<small>{row.department || 'N/A'}</small></td><td><span className="iw-badge">{row.status === 'Pending' ? 'Awaiting triage' : row.status}</span></td><td>{row.riskLevel || 'Not assessed'}</td><td>{row.assignedTo?.employeeName || 'Unassigned'}</td><td>{nextDeadline(row)}</td><td><button type="button" className="iw-secondary" disabled={exporting} aria-label={'Download PDF for ' + row.incidentId} onClick={() => downloadReport(row)}><Download size={16}/>PDF</button><Link className="iw-icon" aria-label={'Open ' + row.title} to={'/dashboard/incidents/' + row._id}><ArrowUpRight size={17}/></Link></td></tr>)}
      </tbody></table></div><Pagination totalRecords={error ? 0 : result.total} recordsPerPage={query.limit} currentPage={query.page} onPageChange={page => setQuery(q => ({ ...q, page }))}/>
    </section>
  </div>;
}
function nextDeadline(row) {
  if (['Closed', 'Rejected', 'Duplicate'].includes(row.status)) return '—';
  const dates = row.actions.filter(a => !a.completedAt).map(a => a.dueDate);
  if (['Accepted', 'Investigating', 'Reopened'].includes(row.status) && row.investigationDue) dates.push(row.investigationDue);
  dates.sort(); return dates[0] ? new Date(dates[0]).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' }) : '—';
}
