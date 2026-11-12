import CompactSearch from './CompactSearch';
import Select from './Select';
import TableToolbar from './TableToolbar';
import Table from './Table';
import Pagination from './Pagination';

const results = {
  Success: 'Completed',
  Failed: 'Could not complete',
  Denied: 'Not permitted',
  Interrupted: 'Stopped before completion',
  Pending: 'Completion not confirmed'
};
const explanations = {
  Success: 'This action was completed.',
  Failed: 'This action could not be completed.',
  Denied: 'The person did not have permission to carry out this action.',
  Interrupted: 'The connection ended before completion could be confirmed.',
  Pending: 'The final result has not been recorded yet.'
};
const requestTypes = { new: 'New privileges', renewal: 'Renew existing privileges', extension: 'Add more procedures' };
const roles = { qualitymanager: 'Quality Manager', superadmin: 'Administrator', admin: 'Administrator', user: 'Staff member' };

function activity(row) {
  const actions = {
    'Submit privilege application': ['Application submitted', 'Submit an application'],
    'Approve privilege application': ['Application approved', 'Approve an application'],
    'Reject privilege application': ['Application rejected', 'Reject an application'],
    'Review privilege application': ['Application reviewed', 'Review an application'],
    'Download supporting document': ['Supporting document downloaded', 'Download a supporting document'],
    Submit: ['Application submitted', 'Submit an application'],
    Update: ['Application updated', 'Update an application'],
    Delete: ['Record deleted', 'Delete a record'],
    Download: ['Document downloaded', 'Download a document']
  };
  const labels = actions[row.activity] || actions[row.action];
  if (!labels) return row.outcome === 'Success' ? 'Activity completed' : 'Activity attempted';
  return row.outcome === 'Success' ? labels[0] : labels[1];
}

export default function PrivilegeAuditLog({ allowed, query, change, result, loading, error, refresh, setPage }) {
  return <div className="iw-page iw-register">
    <header className="iw-heading"><div><h1>Audit log</h1><p>See who submitted, reviewed or downloaded information in Clinical Privileges.</p></div><button type="button" className="iw-secondary" disabled={loading || !allowed} onClick={refresh}>Refresh</button></header>
    {!allowed ? <p role="alert">You do not have permission to view this activity history.</p> : <section className="iw-card">
      <TableToolbar>
        <CompactSearch aria-label="Search by person or activity" placeholder="Search by person or activity" maxLength={100} value={query.search} onChange={event => change({ search: event.target.value })} />
        <Select compact aria-label="Filter by result" value={query.status} onChange={event => change({ status: event.target.value })}><option value="">All results</option>{Object.entries(results).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select>
        <Select compact aria-label="Date order" value={query.direction} onChange={event => change({ direction: event.target.value })}><option value="desc">Newest first</option><option value="asc">Oldest first</option></Select>
      </TableToolbar>
      {error && <p className="iw-error" role="alert">We couldn’t load the activity history. Select Refresh to try again.</p>}
      <div className="iw-table-wrap" role="region" aria-label="Clinical privilege activity history" tabIndex={0}>
        <Table className="iw-register-table" aria-busy={loading}>
          <thead><tr>{['Date and time (UAE)', 'Action taken by', 'Clinician / specialty', 'Request details', 'Activity', 'Result'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={6}>Loading activity history…</td></tr> : error ? null : !result.rows.length ? <tr><td colSpan={6}>{query.search || query.status ? 'No activity matches your search. Try another name or choose All results.' : 'No activity has been recorded yet.'}</td></tr> : result.rows.map(row => <tr key={row._id}>
            <td>{row.timestamp && !Number.isNaN(Date.parse(row.timestamp)) ? new Date(row.timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : 'Date not recorded'}</td>
            <td><strong>{row.actorName || 'Name not recorded'}</strong>{row.actorRole && <small>{roles[row.actorRole.toLowerCase()] || row.actorRole.replace(/([a-z])([A-Z])/g, '$1 $2')}</small>}</td>
            <td><strong>{row.applicationContext?.clinician || 'Clinician not available'}</strong><small>{row.applicationContext?.specialty || 'Specialty not available'}</small></td>
            <td>{requestTypes[row.applicationContext?.requestType] || 'Request type not available'}<small>Assigned reviewer: {row.applicationContext?.assignedApprover || 'Not available'}</small></td>
            <td>{activity(row)}</td>
            <td><strong>{results[row.outcome] || 'Result not recorded'}</strong><small>{explanations[row.outcome] || 'No result was recorded for this activity.'}</small></td>
          </tr>)}</tbody>
        </Table>
      </div>
      <Pagination totalRecords={error ? 0 : result.total} recordsPerPage={query.limit} currentPage={query.page} onPageChange={setPage} />
    </section>}
    <p className="iw-note">Clinician, specialty and request details show the application’s current information. Activity and results describe what happened at the time. Details may be unavailable for older or unsuccessful requests.</p>
  </div>;
}
