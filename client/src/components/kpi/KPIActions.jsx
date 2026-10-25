import { useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';
import { isOverdue } from '../../utils/kpiDisplay';

export default function KPIActions({ records, canManage, onSaved }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('open');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const actions = records.flatMap(report => (report.improvementActions || []).map(action => ({ ...action, report })));
  const visible = actions.filter(action => filter === 'all' || (filter === 'overdue' ? isOverdue(action) : action.status !== 'Completed'));
  const change = event => setEditing(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const save = async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const { reportId, _id, title, owner, dueDate, status, notes } = editing;
      const url = '/api/kpi/' + reportId + '/actions' + (_id ? '/' + _id : '');
      await axios[_id ? 'put' : 'post'](url, { title, owner, dueDate, status, notes }, getAuthConfig());
      await onSaved(); setEditing(null);
    } catch (err) { setError(err.response?.data?.message || 'Could not save the action.'); }
    finally { setBusy(false); }
  };
  return <section className="ki-panel"><div className="ki-section-head"><div><h2>Improvement actions</h2><p>All reporting periods. Assign responsibility, set a due date and record what changed.</p></div>{canManage && <button className="qi-settings" disabled={!records.length || busy} onClick={() => { setError(''); setEditing({ reportId: '', title: '', owner: '', dueDate: '', status: 'Open', notes: '' }); }}>Add action</button>}</div>
    {editing && <form className="ki-form ki-action-editor" onSubmit={save}><h3>{editing._id ? 'Update action' : 'New improvement action'}</h3><fieldset disabled={busy}><div className="ki-form-grid"><label>Indicator and reporting period<select name="reportId" value={editing.reportId} disabled={Boolean(editing._id)} onChange={change} required><option value="">Choose a report</option>{records.map(report => <option value={report._id} key={report._id}>{report.indicatorCode} · {report.indicatorName} · {report.reportingPeriod} {report.reportingYear}</option>)}</select></label><label>Action to take<input name="title" value={editing.title} onChange={change} required maxLength="300" /></label><label>Responsible owner<input name="owner" value={editing.owner} onChange={change} required maxLength="150" /></label><label>Due date<input name="dueDate" type="date" value={editing.dueDate} onChange={change} required /></label><label>Status<select name="status" value={editing.status} onChange={change}>{['Open', 'In progress', 'Completed'].map(value => <option key={value}>{value}</option>)}</select></label><label>Cause, progress and outcome<small>Include the outcome or evidence before completing the action.</small><textarea name="notes" value={editing.notes} onChange={change} maxLength="3000" required={editing.status === 'Completed'} rows="3" /></label></div></fieldset>{error && <p className="qi-error" role="alert">{error}</p>}<div className="ki-buttons"><button className="qi-settings" type="button" disabled={busy} onClick={() => setEditing(null)}>Cancel</button><button className="qi-submit" disabled={busy}>{busy ? 'Saving…' : 'Save action'}</button></div></form>}
    <div className="ki-filters"><label>Show <select value={filter} onChange={event => setFilter(event.target.value)}><option value="open">Open and in progress</option><option value="overdue">Overdue</option><option value="all">All actions</option></select></label><span>{visible.length} actions</span></div>
    <ul className="ki-list">{visible.map(action => <li key={action._id}><div><strong>{action.title}</strong><small>{action.report.indicatorCode} · {action.report.reportingPeriod} {action.report.reportingYear} · {action.owner}</small><small>Due {action.dueDate} · {action.status}{isOverdue(action) ? ' · Overdue' : ''}</small>{action.notes && <p className="ki-notes">{action.notes}</p>}</div>{canManage && <button className="qi-settings" disabled={busy} onClick={() => { setError(''); setEditing({ ...action, reportId: action.report._id, notes: action.notes || '' }); }}>Update</button>}</li>)}</ul>{!visible.length && <p className="qi-empty">No actions in this view. {canManage ? 'Add an action when a result needs follow-up.' : 'The quality team can record follow-up actions here.'}</p>}
  </section>;
}
