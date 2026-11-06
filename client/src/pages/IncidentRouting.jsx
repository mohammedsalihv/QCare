import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import IncidentWorkspace from '../components/IncidentWorkspace';
import UserSelect from '../components/UserSelect';
import { getAuthConfig } from '../utils/authConfig';

export default function IncidentRouting() {
  const [state, setState] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(['/api/incidents/routing', '/api/departments', '/api/locations'].map(url => axios.get(url, { ...getAuthConfig(), signal: controller.signal }))).then(([rules, departments, branches]) => setState({ rules: rules.data, departments: departments.data.filter(d => d.isActive !== false), branches: branches.data.filter(b => b.isActive !== false) })).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Could not load routing settings.'); });
    return () => controller.abort();
  }, []);
  const change = (type, key, id, field, value) => setState(previous => {
    const rows = previous.rules[type], existing = rows.find(r => r[key] === id) || { [key]: id, owner: '', keywords: [] };
    return { ...previous, rules: { ...previous.rules, [type]: [...rows.filter(r => r[key] !== id), { ...existing, [field]: value }] } };
  });
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const rules = state.rules;
      const { data } = await axios.put('/api/incidents/routing', { fallback: rules.fallback, version: rules.__v, departments: rules.departments.filter(d => d.owner && state.departments.some(x => x._id === d.department)), branches: rules.branches.filter(b => b.owner && state.branches.some(x => x._id === b.branch)) }, getAuthConfig());
      setState(previous => ({ ...previous, rules: data })); setMessage('Routing saved. New incidents use these rules; existing assignments are unchanged.');
    } catch (e) { setError(e.response?.data?.message || 'Could not save routing.'); } finally { setBusy(false); }
  };
  return <DashboardLayout><IncidentWorkspace><div className="iw-page"><header className="iw-heading"><div><h1>Incident responsibility routing</h1><p>Map existing users to department and clinic responsibilities. Only confirmed owners should be selected.</p></div></header>{error && <p role="alert" className="iw-error">{error}</p>}{message && <p role="status" className="iw-note">{message}</p>}{!state ? <p>{error ? 'Settings unavailable.' : 'Loading routing…'}</p> : <form onSubmit={save}><fieldset disabled={busy} className="iw-body"><section className="iw-card iw-padded"><h2>Quality investigator / triage owner</h2><p>Investigates, assesses risk and follows up on routed incidents. Also resolves missing department ownership. Choose a Quality Manager, Quality Officer or administrator.</p><UserSelect required aria-label="Quality investigator / triage owner" value={state.rules.fallback || ''} onChange={e => setState({ ...state, rules: { ...state.rules, fallback: e.target.value } })}/></section>
    <section className="iw-card iw-padded"><h2>Primary responsibility · department manager</h2>{state.rules.suggested && <p className="iw-note">Draft suggestions were matched exactly to existing department-head names or employee IDs. Review the selections and save to activate routing.</p>}<p>The selected department takes priority. If the reporter chooses automatic detection, configured phrases are matched locally against the title and description. Multiple department matches go to Quality; this is phrase matching, not an AI clinical assessment.</p>{state.departments.map(d => { const rule = state.rules.departments.find(r => r.department === d._id); return <div className="iw-action" key={d._id}><h3>{d.name}</h3><div className="iw-grid"><label>Responsible manager<UserSelect value={rule?.owner || ''} onChange={e => change('departments', 'department', d._id, 'owner', e.target.value)}/></label><label>Matching phrases · comma separated<input value={(rule?.keywords || []).join(',')} onChange={e => change('departments', 'department', d._id, 'keywords', e.target.value.split(','))} onBlur={() => change('departments', 'department', d._id, 'keywords', (rule?.keywords || []).map(k => k.trim()).filter(Boolean))} placeholder="e.g. network outage, computer fault"/></label></div></div>; })}</section>
    <section className="iw-card iw-padded"><h2>Secondary responsibility · branch manager / supervisor</h2><p>Receives access and notifications for incidents at this branch, and can request departmental opinions. The department manager remains accountable from acceptance through the closure request; Quality leads investigation and follow-up.</p>{state.branches.map(b => <div className="iw-action" key={b._id}><h3>{b.name} · {b.code}</h3><UserSelect aria-label={'Secondary responsible person for ' + b.name} value={state.rules.branches.find(r => r.branch === b._id)?.owner || ''} onChange={e => change('branches', 'branch', b._id, 'owner', e.target.value)}/></div>)}</section><button className="iw-primary">{busy ? 'Saving…' : 'Save routing settings'}</button></fieldset></form>}</div></IncidentWorkspace></DashboardLayout>;
}
