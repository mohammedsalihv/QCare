import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ListToolbar from './ListToolbar';
import Table from './Table';
import Pagination from './Pagination';
import PrivilegeAuditLog from './PrivilegeAuditLog';
import { getAuthConfig } from '../utils/authConfig';
import modules from '../../../server/utils/auditModules.json';
import './incidentWorkflow.css';

export default function ModuleAuditLog({ moduleKey }) {
  const module = modules.find(item => item.key === moduleKey);
  const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase();
  const permitted = modules.filter(item => ['admin', 'superadmin'].includes(role) || (role === 'qualitymanager' && !item.adminOnly));
  const allowed = permitted.length > 0 && (!moduleKey || permitted.some(item => item.key === moduleKey));
  const [query, setQuery] = useState({ search: '', status: '', module: '', page: 1, limit: 10, sortBy: 'timestamp', direction: 'desc' });
  const [result, setResult] = useState({ rows: [], total: 0 }), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
  const change = patch => setQuery(value => ({ ...value, ...patch, page: 1 }));
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try { const { data } = await axios.get('/api/audit-events', { ...getAuthConfig(), params: { ...query, module: moduleKey || query.module }, signal: controller.signal }); setResult(data); }
      catch (e) { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Audit log unavailable. Retry to load actual records.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [allowed, moduleKey, query, revision]);
  if (moduleKey === 'privileges') return <PrivilegeAuditLog allowed={allowed} query={query} change={change} result={result} loading={loading} error={error} refresh={() => setRevision(value => value + 1)} setPage={page => setQuery(value => ({ ...value, page }))} />;
  return <div className="iw-page iw-register"><header className="iw-heading"><div><h1>{module ? module.label + ' · Audit log' : 'Module audit logs'}</h1><p>Server-recorded actions, outcomes and connection details. Times shown in UAE time.</p>{module?.pages[0] && <Link to={'/dashboard/' + module.pages[0]}>Back to {module.label}</Link>}</div><button className="iw-secondary" disabled={loading || !allowed} onClick={() => setRevision(v => v + 1)}>Refresh</button></header>
    {!allowed ? <p role="alert">You do not have access to this audit log.</p> : <section className="iw-card">
      <ListToolbar list={{ query, change }} searchLabel="Search user, record ID, IP address or request" statuses={['Success', 'Failed', 'Denied', 'Interrupted', 'Pending']} sorts={[{ value: 'timestamp', label: 'Event time' }, { value: 'actorName', label: 'User' }, { value: 'module', label: 'Module' }, { value: 'outcome', label: 'Outcome' }]} extraFilters={moduleKey ? [] : [{ key: 'module', label: 'Filter by module', allLabel: 'All permitted modules', options: permitted.map(item => ({ value: item.key, label: item.label })) }]}/>
      {error && <p role="alert" className="iw-error">{error}</p>}
      <div className="iw-table-wrap" role="region" aria-label="Module audit history" tabIndex={0}><Table className="iw-register-table iw-module-audit" aria-busy={loading}><thead><tr>{['When / module', 'User', 'Activity / outcome', 'Connection', 'Details'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={5}>Loading audit records…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={5}>No server audit events match these filters. New actions are captured from this update onward.</td></tr> : result.rows.map(row => <tr key={row._id}>
          <td>{new Date(row.timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })}<small>{row.module}</small></td>
          <td><strong>{row.actorName || (row.outcome === 'Pending' ? 'Awaiting completion' : 'Unauthenticated / unknown')}</strong><small>{row.actorEmployeeId || '—'} · {row.actorRole || '—'}</small></td>
          <td><strong>{row.activity || row.action}</strong><small>{row.outcome} · HTTP {row.statusCode || '—'}</small><small>{row.method} {row.path}</small></td>
          <td><strong>{row.ipAddress || 'Not recorded'}</strong><small>{row.ipSource === 'trusted-proxy' ? 'Forwarded client address' : 'Network source · may be NAT'}</small><small>{row.browser || 'Unknown'} · {row.operatingSystem || 'Unknown'}</small><small>{row.deviceType || 'Not recorded'}</small></td>
          <td><details><summary>View audit details</summary><dl className="iw-audit-changes"><dt>Request ID</dt><dd>{row.requestId}</dd><dt>Record ID</dt><dd>{row.recordId || 'Not available'}</dd><dt>Duration</dt><dd>{row.durationMs ?? '—'} ms</dd><dt>Browser user agent</dt><dd>{row.userAgent || 'Not supplied'}</dd><dt>IP source</dt><dd>{row.ipSource === 'trusted-proxy' ? 'Forwarded by a configured trusted proxy' : 'Direct connection source; may be a firewall/NAT address'}</dd><dt>Connecting peer</dt><dd>{row.peerIpAddress || row.ipAddress || 'Not recorded'}</dd><dt>Submitted fields</dt><dd>{row.details?.submittedFields?.join(', ') || 'None'}</dd><dd>Submitted fields do not prove every value changed. Passwords, tokens and file contents are excluded.</dd>{!!row.details?.uploadedFiles?.length && <><dt>Files supplied</dt><dd>{row.details.uploadedFiles.map(file => `${file.mime || 'Unknown type'} (${file.size || 0} bytes)`).join(', ')}</dd></>}</dl></details></td>
        </tr>)}
      </tbody></Table></div><Pagination totalRecords={error ? 0 : result.total} recordsPerPage={query.limit} currentPage={query.page} onPageChange={page => setQuery(value => ({ ...value, page }))}/>
    </section>}
    <p className="iw-note">Browser and device details come from the browser’s user-agent header and can be changed by the client. Older incident workflow history remains in Incident Management → Audit log.</p>
  </div>;
}
