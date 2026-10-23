import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import ComplaintDashboard from '../components/px/ComplaintDashboard';
import ComplaintTable from '../components/px/ComplaintTable';
import ComplaintDetailDrawer from '../components/px/ComplaintDetailDrawer';
import { useNotification } from '../components/NotificationContext';
import { 
  Heart, 
  MessageSquare, 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  PieChart as ChartIcon,
  Search
} from 'lucide-react';

const PatientExperienceCenter = () => {
  const { showNotification } = useNotification();
  const [createKind, setCreateKind] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | list | surveys
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

      const [statsRes, complaintsRes] = await Promise.all([
        axios.get('/api/patient-experience/complaints/dashboard', config),
        axios.get('/api/patient-experience/complaints', config)
      ]);

      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
    } catch (error) {
      showNotification('Failed to load experience data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintDetails = async (id) => {
    try {
      const res = await axios.get(`/api/patient-experience/complaints/${id}`, {
        ...getAuthConfig()
      });
      setSelectedComplaint(res.data);
    } catch (error) {
      showNotification('Error fetching complaint details', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedComplaintId) {
      fetchComplaintDetails(selectedComplaintId);
    } else {
      setSelectedComplaint(null);
    }
  }, [selectedComplaintId]);

  const handleAction = async (endpoint, body = {}) => {
    try {
      await axios.put(`/api/patient-experience/complaints/${selectedComplaintId}/${endpoint}`, body, {
        ...getAuthConfig()
      });
      showNotification('Action processed successfully', 'success');
      fetchComplaintDetails(selectedComplaintId);
      fetchData();
    } catch (error) {
      showNotification('Action failed', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Experience Dashboard', icon: LayoutDashboard },
    { id: 'list', label: 'Complaints Register', icon: ClipboardList },
    { id: 'surveys', label: 'Survey Insights', icon: ChartIcon },
  ];

  return (
    <DashboardLayout title="Patient Experience & Complaints">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-[#040404]/20 ">
                 <Heart className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">Patient Voice & Rights</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Complaint Resolution • Sentiment Analysis • DOH Reporting</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 font-semibold rounded-2xl border border-slate-200 text-[12px] normal-case tracking-normal hover:bg-slate-50 transition-all shadow-sm">
                <Search className="w-4 h-4" />
                Find Patient
              </button>
              <button type="button" onClick={() => setCreateKind('complaint')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Log Complaint
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setView(item.id)}
               className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all ${
                 view === item.id ? 'bg-primary text-white shadow-lg' : 'text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-50'
               }`}
             >
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
           ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#040404]"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <ComplaintDashboard stats={stats} />}
            {view === 'list' && <ComplaintTable complaints={complaints} onView={(id) => setSelectedComplaintId(id)} />}
            {view === 'surveys' && (
              <div className="flex flex-col items-center justify-center py-40 text-center">
                 <ChartIcon className="w-16 h-16 text-slate-800 font-semibold mb-6" />
                 <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">Survey Sentiment Insights</h3>
                 <p className="text-[13px] text-slate-800 font-semibold max-w-sm mt-2">Aggregate NPS and real-time patient sentiment analysis will appear here once survey data is collected.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ComplaintDetailDrawer 
        isOpen={!!selectedComplaintId}
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaintId(null)}
        onAcknowledge={() => handleAction('acknowledge')}
        onResolve={() => handleAction('resolve', { resolutionSummary: 'Issue addressed with department', patientSatisfied: true })}
        onEscalate={() => handleAction('escalate', { escalationReason: 'Escalated per patient request' })}
        onAddAction={(note) => handleAction('update', { actionNote: note, status: 'investigating' })}
      />
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('Record saved successfully', 'success'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default PatientExperienceCenter;
