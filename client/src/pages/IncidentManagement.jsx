import IncidentDemo from '../components/IncidentDemo';
import IncidentWorkspace from '../components/IncidentWorkspace';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import IncidentReportPage from '../components/IncidentReportPage';
import IncidentRegister from './IncidentRegister';
import { useNotification } from '../components/NotificationContext';
const initial = { title: '', description: '', category: 'Clinical', location: '', dateOfIncident: '', severity: 'Low' };
export default function IncidentManagement({ reportPage = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(initial);
  const [reportFiles, setReportFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { showNotification, confirm } = useNotification();
  const loggedInUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  useEffect(() => { if (searchParams.get('action') === 'new') navigate('/dashboard/incidents/new', { replace: true }); }, [searchParams, navigate]);
  const closeReport = () => { setFormData(initial); setReportFiles([]); navigate('/dashboard/incidents'); };
  const cancelReport = () => {
    if (formData.title || formData.description || formData.branch || reportFiles.length) confirm({ title: 'Discard this report?', message: 'This report has not been submitted. Discard your entries and return to the register?', confirmLabel: 'Discard report', cancelLabel: 'Keep editing', onConfirm: closeReport });
    else closeReport();
  };
  const leaveReport = next => {
    if (reportPage && (formData.title || formData.description || formData.branch || reportFiles.length)) confirm({ title: 'Discard this report?', message: 'Your report has not been submitted.', confirmLabel: 'Discard report', cancelLabel: 'Keep editing', onConfirm: next });
    else next();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.dateOfIncident || new Date(formData.dateOfIncident)>new Date()) return showNotification('Select a valid past date and time.', 'error');
    if (formData.notifyChoice==='Yes' && !formData.notifyStaff?.length) return showNotification('Select at least one staff member to notify.', 'error');
    if (reportFiles.length>5 || reportFiles.reduce((n,f)=>n+f.size,0)>12*1024*1024) return showNotification('Attach up to 5 files, at most 12 MB combined.', 'error');
    setSubmitting(true);
    try {
      const payload = new FormData(); payload.append('payload',JSON.stringify(formData)); reportFiles.forEach(file=>payload.append('attachments',file));
      const { data: saved } = await axios.post('/api/incidents', payload, {
        headers: { Authorization: `Bearer ${loggedInUser.token}` }
      });
      showNotification('Incident reported: ' + saved.incidentId, 'success');
      setReportFiles([]);
      setFormData(initial);
      navigate('/dashboard/incidents/' + saved._id);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to report incident', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  return <DashboardLayout><IncidentWorkspace beforeNavigate={leaveReport} busy={submitting}>{reportPage ? <IncidentReportPage form={formData} setForm={setFormData} files={reportFiles} setFiles={setReportFiles} onSubmit={handleSubmit} onCancel={cancelReport} busy={submitting}/> : searchParams.get('view') === 'demo' ? <IncidentDemo/> : <IncidentRegister key={searchParams.get('view') || 'all'} view={searchParams.get('view') || ''}/>}</IncidentWorkspace></DashboardLayout>;
}
