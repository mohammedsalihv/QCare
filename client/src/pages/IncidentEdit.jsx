import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import IncidentWorkspace from '../components/IncidentWorkspace';
import IncidentReportPage from '../components/IncidentReportPage';
import IncidentReportDetails from '../components/IncidentReportDetails';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from '../components/NotificationContext';

export default function IncidentEdit() {
  const { id } = useParams(), navigate = useNavigate();
  const [row, setRow] = useState(null), [form, setForm] = useState(null), [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [dirty, setDirty] = useState(false);
  const { confirm, showNotification } = useNotification();
  const allowed = JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase() === 'superadmin';
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    axios.get('/api/incidents/' + id, { ...getAuthConfig(), signal: controller.signal }).then(({ data }) => {
      const labels = key => (data[key] || []).map(u => ({ id: u._id || u, name: u.employeeName || u.employeeId || 'Staff member' }));
      setRow(data); setForm({ ...data, branch: data.branch?._id || data.branch || '', department: data.department || '__auto__', involvedStaff: labels('involvedStaff').map(u => u.id), notifyStaff: labels('notifyStaff').map(u => u.id), involvedStaffLabels: labels('involvedStaff'), notifyStaffLabels: labels('notifyStaff'), dateOfIncident: new Date(new Date(data.dateOfIncident).getTime() + 4 * 3600000).toISOString().slice(0, 19) + '+04:00', reason: '' });
    }).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load incident.'); });
    return () => controller.abort();
  }, [allowed, id]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const leave = next => dirty ? confirm({ title: 'Discard report changes?', message: 'Your unsaved report changes will be discarded.', confirmLabel: 'Discard changes', onConfirm: next }) : next();
  const save = async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const fields = ['title', 'description', 'category', 'severity', 'branch', 'location', 'department', 'areaRoom', 'dateOfIncident', 'harmLevel', 'involvedStaff', 'witnesses', 'immediateActions', 'notifyChoice', 'notifyStaff', 'reason'];
      const payload = Object.fromEntries(fields.map(key => [key, form[key]]));
      const body = new FormData(); body.append('payload', JSON.stringify({ ...payload, version: row.__v })); files.forEach(file => body.append('attachments', file));
      await axios.put(`/api/incidents/${id}/report`, body, getAuthConfig()); setDirty(false); showNotification('Report updated. Changes recorded in audit log.', 'success'); navigate('/dashboard/incidents/' + id);
    } catch (e) { setError(e.response?.data?.message || 'Unable to save report. Your entries are still available.'); window.scrollTo(0, 0); }
    finally { setBusy(false); }
  };
  return <DashboardLayout><IncidentWorkspace busy={busy} beforeNavigate={leave}><div className="iw-page">
    {!allowed ? <p role="alert">Only Superadmin can edit incident reports.</p> : <>{error && <p role="alert" className="iw-error">{error}</p>}{form ? <>
      <p className="iw-reference">Editing {row.incidentId}</p>
      <IncidentReportPage editing form={form} setForm={update => { setDirty(true); setForm(update); }} files={files} setFiles={value => { setDirty(true); setFiles(value); }} busy={busy} onSubmit={save} onCancel={() => leave(() => navigate('/dashboard/incidents/' + id))}/>
      {!!row.attachments?.length && <section className="iw-card iw-padded"><h2>Existing attachments retained</h2><IncidentReportDetails incident={row} attachmentsOnly/></section>}
    </> : !error && <p>Loading report…</p>}</>}
  </div></IncidentWorkspace></DashboardLayout>;
}
