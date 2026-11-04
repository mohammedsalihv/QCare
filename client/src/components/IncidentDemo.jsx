import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { getAuthConfig } from '../utils/authConfig';
import { incidentDownload } from '../utils/incidentDownload';
import { useNotification } from './NotificationContext';

export default function IncidentDemo() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [step, setStep] = useState(0), [revision, setRevision] = useState(0);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const reviewer = ['admin', 'superadmin', 'qualitymanager'].includes(user.role?.toLowerCase());
  const practice = async () => {
    setBusy(true);
    try { const { data } = await axios.post('/api/incidents/demo/practice', {}, getAuthConfig()); navigate('/dashboard/incidents/' + data._id); }
    catch (e) { showNotification(e.response?.data?.message || 'Unable to open the dummy incident.', 'error'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/incidents/demo/example', { ...getAuthConfig(), signal: controller.signal }).then(({ data }) => setData(data)).catch(e => { if (!controller.signal.aborted) setError(e.response?.status === 404 ? 'The demo is not available on this server yet. The incident backend update must be deployed.' : e.response?.data?.message || 'Unable to load the demo. Please try again.'); });
    return () => controller.abort();
  }, [revision]);
  const download = async () => {
    setBusy(true);
    try { await incidentDownload('/api/incidents/demo/report.pdf', 'DEMO-INC-001.pdf'); }
    catch (e) { showNotification(e.message, 'error'); }
    finally { setBusy(false); }
  };
  if (!data) return <div className="iw-page"><p role={error ? 'alert' : 'status'}>{error || 'Loading demo incident…'}</p>{error && <button className="iw-secondary" onClick={() => { setError(''); setRevision(value => value + 1); }}>Retry demo</button>}</div>;
  const current = data.steps[step];
  return <div className="iw-page">
    <header className="iw-heading"><div><span className="ir-eyebrow">DEMO · TRAINING ONLY</span><h1>{data.row.title}</h1><p>{data.row.incidentId} · Fictional example of a completed incident</p></div><button className="iw-secondary" disabled={busy} onClick={download}><Download size={16}/>{busy ? 'Downloading…' : 'Download demo PDF'}</button></header>
    <p className="iw-note">This is a read-only walkthrough. All people, events and evidence are fictional. It sends no notifications and does not affect live incident totals. Live incidents require the appropriate staff roles and an independent closing reviewer.</p>
    <section className="iw-card iw-padded"><h2>Try a dummy incident</h2><p>Open an editable training record starting at acceptance. Reopening it keeps your practice progress. Use the normal staff roles; final closure requires an independent reviewer.</p><div className="iw-demo-steps">{reviewer && <button className="iw-primary" disabled={busy} onClick={practice}>Create / open my dummy incident</button>}<Link className="iw-secondary" to="/dashboard/incidents?view=training">View dummy incidents</Link></div></section>
    <section className="iw-card iw-padded"><h2>Follow the incident from report to closure</h2><div className="iw-demo-steps" aria-label="Demo workflow steps">{data.steps.map((item, index) => <button key={item.event} className={index === step ? 'iw-primary' : 'iw-secondary'} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>{index + 1}. {item.title}</button>)}</div></section>
    <section className="iw-card iw-padded" aria-live="polite"><span className="iw-badge">{current.status}</span><h2>Step {step + 1}: {current.title}</h2><p><strong>Responsible role:</strong> {current.role}</p><h3>What happened in this example</h3><p>{current.detail}</p><h3>How to do this in a live incident</h3><p>{current.next}</p>
      {step === 3 || step === 4 ? data.row.actions.map(action => <article className="iw-comment" key={action.title}><strong>{action.kind}: {action.title}</strong><p>Owner: {action.owner.employeeName} · Due: {new Date(action.dueDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}</p><p>Success criteria: {action.successCriteria}</p>{step === 4 && <p>Completion evidence: {action.completion}</p>}</article>) : null}
      <div className="iw-demo-steps"><button className="iw-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous step</button><button className="iw-primary" onClick={() => setStep(step === data.steps.length - 1 ? 0 : step + 1)}>{step === data.steps.length - 1 ? 'Restart walkthrough' : 'Next step'}</button></div>
    </section>
  </div>;
}
