import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Download, ArrowUpRight, FileChartColumn } from 'lucide-react';
import ListToolbar from '../components/ListToolbar';
import Pagination from '../components/Pagination';
import IncidentDateField from '../components/IncidentDateField';
import { getAuthConfig } from '../utils/authConfig';
import { incidentDownload } from '../utils/incidentDownload';
import { useNotification } from '../components/NotificationContext';
import '../components/incidentWorkflow.css';

const statuses = ['Pending', 'Needs clarification', 'Accepted', 'Investigating', 'Action in progress', 'Closure review', 'Closed', 'Rejected', 'Duplicate', 'Reopened', 'Resolved'];
export default function IncidentRegister() {
  const [query, setQuery] = useState({ search: '', status: '', sortBy: 'createdAt', direction: 'desc', limit: 10, page: 1, scope: '', overdue: '' });
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
  return <div className="iw-page">
    <header className="iw-heading"><div><span className="ir-eyebrow">QUALITY & SAFETY</span><h1>Incident management</h1><p>Report, investigate and follow through to verified closure.</p></div><Link className="iw-primary" to="/dashboard/incidents/new"><Plus size={17}/>Report incident</Link></header>
    <div className="iw-queue" aria-label="Work queues">{[['', 'All incidents'], ['mine', 'Assigned to me'], ['overdue', 'Overdue'], ['review', 'Closure review']].map(([value, label]) => <button key={value} type="button" aria-pressed={value === 'overdue' ? query.overdue === 'yes' : value === 'review' ? query.status === 'Closure review' : query.scope === value && !query.overdue && !query.status} onClick={() => change({ scope: value === 'mine' ? 'mine' : '', overdue: value === 'overdue' ? 'yes' : '', status: value === 'review' ? 'Closure review' : '' })}>{label}</button>)}</div>
    <section className="iw-card">
      <div className="iw-toolbar"><ListToolbar list={{ query, change }} searchLabel="Search reference, title, branch or department" statuses={statuses} sorts={[{ value: 'createdAt', label: 'Reported date' }, { value: 'title', label: 'Title' }, { value: 'status', label: 'Status' }, { value: 'investigationDue', label: 'Investigation deadline' }]} extraFilters={[{ key: 'riskLevel', label: 'Risk level', allLabel: 'All risk levels', options: ['Low', 'Medium', 'High', 'Critical'] }, { key: 'category', label: 'Category', allLabel: 'All categories', options: ['Clinical', 'Safety', 'Administrative', 'Technical', 'Other'] }]}/><button type="button" className="iw-icon" disabled={exporting} title="Download filtered register (CSV)" aria-label="Download filtered register (CSV)" onClick={() => download()}><Download size={18}/></button><button type="button" className="iw-icon" disabled={exporting} title="Download summary PDF" aria-label="Download summary PDF" onClick={() => download(true)}><FileChartColumn size={18}/></button></div>
      <details className="iw-date-filters"><summary>Incident date range</summary><div className="iw-grid"><IncidentDateField label="From" value={query.from} onChange={from => change({ from })}/><IncidentDateField label="To" value={query.to} onChange={to => change({ to })}/></div></details>
      {error && <p role="alert" className="iw-error">{error} <button onClick={() => setRevision(v => v + 1)}>Retry</button></p>}
      <div className="iw-table-wrap"><table aria-busy={loading}><thead><tr>{['S/N', 'Incident', 'Branch / department', 'Status', 'Risk', 'Investigator', 'Next deadline', ''].map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={8} className="iw-empty">Loading incidents…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={8} className="iw-empty">No incidents match these filters.</td></tr> : result.rows.map((row, index) => <tr key={row._id}><td>{(query.page - 1) * query.limit + index + 1}</td><td><Link to={'/dashboard/incidents/' + row._id}>{row.title}</Link><small>{row.incidentId}</small></td><td>{row.location}<small>{row.department || 'N/A'}</small></td><td><span className="iw-badge">{row.status === 'Pending' ? 'Awaiting triage' : row.status}</span></td><td>{row.riskLevel || 'Not assessed'}</td><td>{row.assignedTo?.employeeName || 'Unassigned'}</td><td>{nextDeadline(row)}</td><td><Link className="iw-icon" aria-label={'Open ' + row.title} to={'/dashboard/incidents/' + row._id}><ArrowUpRight size={17}/></Link></td></tr>)}
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
