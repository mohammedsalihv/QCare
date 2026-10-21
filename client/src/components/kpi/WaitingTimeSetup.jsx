import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';

export default function WaitingTimeSetup({ period, year, onSaved }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { axios.get('/api/kpi/waiting-time/catalog', getAuthConfig()).then(({data}) => setCatalog(data)).catch(() => setMessage('Could not load the waiting-time catalog. Refresh to retry.')); }, []);
  const install = async () => {
    setBusy(true); setMessage('');
    try {
      const {data} = await axios.post('/api/kpi/waiting-time/install', { codes: selected, reportingPeriod: period, reportingYear: Number(year) }, getAuthConfig());
      setMessage(`Added ${data.created.length} indicators. ${data.existing.length} existing definitions were preserved.${data.existing.length ? ' Existing definitions must already use the DOH preset to calculate from timestamps.' : ''}`);
      await onSaved();
    } catch (err) { setMessage(err.response?.data?.message || 'Could not add indicators.'); }
    finally { setBusy(false); }
  };
  return <details className="qi-rule-editor"><summary>Add DOH waiting-time KPIs · Guidance v9.1</summary>
    <p>Effective Q3 2026. Select the services your facility provides. Clinical population and exclusions must be reviewed by the department before upload. WT001, WT002 and WT004 are retired.</p>
    <div className="qi-rule-grid">{catalog.map(p => <label key={p.indicatorCode}><span><input type="checkbox" disabled={busy} checked={selected.includes(p.indicatorCode)} onChange={e => setSelected(previous => e.target.checked ? [...previous, p.indicatorCode] : previous.filter(code => code !== p.indicatorCode))} /> {p.indicatorCode} · {p.indicatorName}</span><small>Page {p.page} · {p.target === null ? 'No numeric target specified' : `${p.targetDirection === 'lower' ? (p.targetStrict ? '<' : '≤') : '≥'} ${p.target}%`}</small></label>)}</div>
    <button className="qi-submit" type="button" disabled={busy || !selected.length} onClick={install}>{busy ? 'Adding...' : `Add selected KPIs for ${period} ${year}`}</button>
    {message && <p role="status">{message}</p>}
  </details>;
}
