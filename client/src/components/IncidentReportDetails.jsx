import axios from 'axios';
import { useState } from 'react';
import { MapPin, Users, FileText, Paperclip, Download, Clock, ShieldCheck } from 'lucide-react';
import { getAuthConfig } from '../utils/authConfig';
import { statusInfo } from '../utils/incidentPresentation';
import './incidentDetails.css';

const when = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : '';
const staffNames = values => values?.map(person => person.employeeName || 'Unavailable staff').join(', ');
function Facts({ rows }) {
  return <dl className="id-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={!value ? 'id-muted' : undefined}>{value || 'Not supplied'}</dd></div>)}</dl>;
}
function Narrative({ title, value, empty = 'Not recorded' }) {
  return <div className="id-narrative"><h4>{title}</h4><p className={!value ? 'id-muted' : undefined}>{value || empty}</p></div>;
}
export default function IncidentReportDetails({ incident, attachmentsOnly = false }) {
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const download = async file => {
    setDownloading(file._id); setError('');
    try {
      const { data } = await axios.get('/api/incidents/' + incident._id + '/attachments/' + file._id, { ...getAuthConfig(), responseType: 'blob' });
      const url = URL.createObjectURL(data), anchor = document.createElement('a');
      anchor.href = url; anchor.download = file.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Could not download the attachment.'); }
    finally { setDownloading(null); }
  };
  const status = statusInfo(incident.status);
  const evidence = <section className="id-evidence" aria-label="Report attachments">
    <div className="id-section-title"><Paperclip size={17} aria-hidden="true"/><h3>Attachments</h3><span className="id-count">{incident.attachments?.length || 0}</span></div>
    {incident.attachments?.length ? <ul className="id-files">{incident.attachments.map(file => <li key={file._id}><button type="button" disabled={downloading !== null} onClick={() => download(file)} aria-label={'Download ' + file.name}><FileText size={18} aria-hidden="true"/><span><strong>{file.name}</strong><small>{file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / 1024 / 1024).toFixed(1) + ' MB'} · {downloading === file._id ? 'Downloading…' : 'Download attachment'}</small></span><Download size={16} aria-hidden="true"/></button></li>)}</ul> : <p className="id-muted">No files attached to this report.</p>}
    {error && <p role="alert" className="iw-error">{error}</p>}
  </section>;
  if (attachmentsOnly) return evidence;
  return <article className="id-report" aria-label="Incident report details">
    <header className="id-report-header"><div><span className="id-eyebrow">INCIDENT REPORT</span><h2>{incident.incidentId}</h2><p>{incident.title}</p></div><span className={'iw-status-pill iw-tone-' + status.tone}>{status.label}</span></header>
    <dl className="id-highlights">{[['Incident type', incident.category], ['Initial severity', incident.severity], ['Harm level', incident.harmLevel]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not supplied'}</dd></div>)}</dl>
    <div className="id-columns">
      <div className="id-story"><section><div className="id-section-title"><FileText size={17} aria-hidden="true"/><h3>Incident & immediate response</h3></div><Narrative title="What happened" value={incident.description}/><Narrative title="Immediate actions" value={incident.immediateActions}/></section>
        <section><div className="id-section-title"><Users size={17} aria-hidden="true"/><h3>People & witnesses</h3></div><Facts rows={[[ 'Reported by', incident.reportedBy?.employeeName ],['Staff involved',staffNames(incident.involvedStaff)]]}/><Narrative title="Witnesses and observations" value={incident.witnesses} empty="No witness information recorded."/></section>
      </div>
      <aside className="id-context" aria-label="Location, timing and notifications">
        <section><div className="id-section-title"><MapPin size={17} aria-hidden="true"/><h3>Location</h3></div><Facts rows={[[ 'Branch', incident.location ],['Corresponding department',incident.department],['Area / room',incident.areaRoom]]}/></section>
        <section><div className="id-section-title"><Clock size={17} aria-hidden="true"/><h3>Dates & times <small>Dubai · UTC+4</small></h3></div><Facts rows={[[ 'Incident occurred', when(incident.dateOfIncident) ],['Reported',when(incident.createdAt)],['Last updated',when(incident.updatedAt)]]}/></section>
        <section><div className="id-section-title"><ShieldCheck size={17} aria-hidden="true"/><h3>Additional notifications</h3></div><Facts rows={[[ 'Requested', incident.notifyChoice || (incident.notifyStaff?.length ? 'Yes' : 'Not recorded in this older report') ],['Staff notified',staffNames(incident.notifyStaff)]]}/></section>
      </aside>
    </div>
    {evidence}
  </article>;
}
