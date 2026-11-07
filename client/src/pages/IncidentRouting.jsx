import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import IncidentWorkspace from '../components/IncidentWorkspace';
import UserSelect from '../components/UserSelect';
import { getAuthConfig } from '../utils/authConfig';

export default function IncidentSettings() {
  const [state, setState] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(['/api/incidents/routing', '/api/departments'].map(url => axios.get(url, { ...getAuthConfig(), signal: controller.signal }))).then(([rules, departments]) => setState({ rules: rules.data, departments: departments.data.filter(d => d.isActive !== false) })).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Could not load incident settings.'); });
    return () => controller.abort();
  }, []);
  const changePhrases = (id, value) => setState(previous => ({ ...previous, rules: { ...previous.rules, departments: [...previous.rules.departments.filter(r => r.department !== id), { department: id, keywords: value.split(',') }] } }));
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const rules = state.rules;
      const departments = rules.departments.filter(d => state.departments.some(x => x._id === d.department)).map(d => ({ department: d.department, keywords: d.keywords.map(k => k.trim()).filter(Boolean) })).filter(d => d.keywords.length);
      const { data } = await axios.put('/api/incidents/routing', { fallback: rules.fallback, version: rules.__v, departments }, getAuthConfig());
      setState(previous => ({ ...previous, rules: data })); setMessage('Incident settings saved. Existing incident assignments are unchanged.');
    } catch (e) { setError(e.response?.data?.message || 'Could not save settings.'); } finally { setBusy(false); }
  };
  return <DashboardLayout><IncidentWorkspace><div className="iw-page">
    <header className="iw-heading"><div><h1>Incident settings</h1><p>Set the Quality investigator and optional department detection phrases.</p></div></header>
    <section className="iw-card iw-padded"><h2>Responsibility comes from your master records</h2><p>The accountable person is the head saved in Department Master. The secondary responsible person is the manager or supervisor saved in Branch Master. These are used automatically for new incidents.</p><div className="flex flex-wrap gap-3"><Link className="iw-secondary" to="/dashboard/departments">Open Department Master</Link><Link className="iw-secondary" to="/dashboard/location-types">Open Branch Master</Link></div></section>
    {error && <p role="alert" className="iw-error">{error}</p>}{message && <p role="status" className="iw-note">{message}</p>}
    {!state ? <p>{error ? 'Settings unavailable.' : 'Loading settings…'}</p> : <form onSubmit={save}><fieldset disabled={busy} className="iw-body">
      <section className="iw-card iw-padded"><h2>Quality investigator / triage owner</h2><p>Coordinates investigation, risk assessment and follow-up. Handles reports where the responsible department is unclear.</p><UserSelect required aria-label="Quality investigator / triage owner" value={state.rules.fallback || ''} onChange={e => setState({ ...state, rules: { ...state.rules, fallback: e.target.value } })}/></section>
      <details className="iw-card iw-padded"><summary>Optional department detection phrases</summary><p>Used only when the reporter selects automatic department detection. If multiple departments match, Quality reviews the assignment.</p>{state.departments.map(d => <label className="iw-action" key={d._id}>{d.name}<input aria-label={'Matching phrases for ' + d.name} value={(state.rules.departments.find(r => r.department === d._id)?.keywords || []).join(',')} onChange={e => changePhrases(d._id, e.target.value)} placeholder="Comma-separated phrases"/></label>)}</details>
      <button className="iw-primary">{busy ? 'Saving…' : 'Save incident settings'}</button>
    </fieldset></form>}
  </div></IncidentWorkspace></DashboardLayout>;
}
