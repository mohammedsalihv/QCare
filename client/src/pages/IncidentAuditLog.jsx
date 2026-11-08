import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import IncidentWorkspace from '../components/IncidentWorkspace';
import Table from '../components/Table';
import ListToolbar from '../components/ListToolbar';
import Pagination from '../components/Pagination';
import { getAuthConfig } from '../utils/authConfig';

const events = { reported: 'Reported', editReport: 'Report edited', deleteIncident: 'Incident deleted', accept: 'Accepted', assign: 'Assignment changed', route: 'Master assignments applied', clarify: 'Clarification requested', reject: 'Rejected', duplicate: 'Marked duplicate', start: 'Investigation started', investigate: 'Investigation updated', addAction: 'Action added', editAction: 'Action updated', approvePlan: 'Action plan approved', completeAction: 'Action completed', requestOpinion: 'Opinion requested', respondOpinion: 'Opinion submitted', requestClosure: 'Closure requested', close: 'Closure approved', return: 'Returned for further work', reopen: 'Reopened', comment: 'Comment added', evidence: 'Evidence uploaded', pdf: 'PDF downloaded' };
const display = value => value == null || value === '' ? 'Not recorded' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const fieldLabel = key => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

export default function IncidentAuditLog() {
  const allowed = ['superadmin', 'qualitymanager', 'admin'].includes(JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase());
  const [query, setQuery] = useState({ search: '', event: '', sortBy: 'at', direction: 'desc', page: 1, limit: 10 });
  const [result, setResult] = useState({ rows: [], total: 0 }), [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const change = patch => setQuery(current => ({ ...current, ...patch, page: 1 }));
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try { const { data } = await axios.get('/api/incidents/audit-log', { ...getAuthConfig(), params: query, signal: controller.signal }); setResult(data); }
      catch (e) { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load audit log.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [allowed, query, revision]);
  return <DashboardLayout><IncidentWorkspace><div className="iw-page iw-register"><header className="iw-heading"><div><span className="ir-eyebrow">INCIDENT MANAGEMENT</span><h1>Audit log</h1><p>Who changed an incident, what happened and when. History is retained after deletion.</p></div><button className="iw-secondary" onClick={() => setRevision(v => v + 1)} disabled={loading}>Refresh</button></header>
    {!allowed ? <p role="alert">Only authorized incident reviewers can view this audit log.</p> : <section className="iw-card">
      <ListToolbar list={{ query, change }} searchLabel="Search incident ID, title, person or reason" statuses={null} sorts={[{ value: 'at', label: 'Event date' }, { value: 'incidentId', label: 'Incident ID' }, { value: 'actor', label: 'Performed by' }]} extraFilters={[{ key: 'event', label: 'Filter by activity', allLabel: 'All activities', options: Object.entries(events).map(([value, label]) => ({ value, label })) }]}/>
      {error && <p className="iw-error" role="alert">{error}</p>}
      <div className="iw-table-wrap" role="region" aria-label="Incident audit history" tabIndex={0}><Table className="iw-register-table iw-audit-table" aria-busy={loading}><thead><tr>{['Date & time (UAE)', 'Incident', 'Activity', 'Performed by', 'Details'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={5}>Loading audit history…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={5}>No audit entries match these filters.</td></tr> : result.rows.map(row => <tr key={row._id}>
          <td>{new Date(row.at).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })}</td>
          <td><strong className="iw-record-id">{row.incidentId}</strong>{row.deletedAt ? <><span>{row.title}</span><small>Deleted · history retained</small></> : <Link to={'/dashboard/incidents/' + row.incident} className="iw-record-title">{row.title}</Link>}</td>
          <td>{events[row.event] || row.event}</td><td>{row.actorName || 'Not recorded'}</td><td><p className="iw-audit-detail">{row.detail || '—'}</p>{row.changes && <details><summary>View field changes</summary><dl className="iw-audit-changes">{Object.entries(row.changes).map(([key, value]) => <div key={key}><dt>{fieldLabel(key)}</dt>{value.added ? <dd>Added: {value.added.map(a => a.name).join(', ')}</dd> : <><dd><strong>Before:</strong> {display(value.before)}</dd><dd><strong>After:</strong> {display(value.after)}</dd></>}</div>)}</dl></details>}</td>
        </tr>)}
      </tbody></Table></div><Pagination totalRecords={error ? 0 : result.total} recordsPerPage={query.limit} currentPage={query.page} onPageChange={page => setQuery(q => ({ ...q, page }))}/>
    </section>}
  </div></IncidentWorkspace></DashboardLayout>;
}
