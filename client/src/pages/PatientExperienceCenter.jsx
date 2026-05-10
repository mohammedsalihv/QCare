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
  const [view, setView] = useState('dashboard'); // dashboard | list | surveys
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

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
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/patient-experience/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = localStorage.getItem('token');
      await axios.put(`/api/patient-experience/complaints/${selectedComplaintId}/${endpoint}`, body, {
        headers: { Authorization: `Bearer ${token}` }
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
              <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-200 dark:shadow-none">
                 <Heart className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Patient Voice & Rights</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Complaint Resolution • Sentiment Analysis • DOH Reporting</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <Search className="w-4 h-4" />
                Find Patient
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Log Complaint
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm w-fit">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setView(item.id)}
               className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                 view === item.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
               }`}
             >
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
           ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <ComplaintDashboard stats={stats} />}
            {view === 'list' && <ComplaintTable complaints={complaints} onView={(id) => setSelectedComplaintId(id)} />}
            {view === 'surveys' && (
              <div className="flex flex-col items-center justify-center py-40 text-center">
                 <ChartIcon className="w-16 h-16 text-slate-200 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Survey Sentiment Insights</h3>
                 <p className="text-xs text-slate-400 max-w-sm mt-2">Aggregate NPS and real-time patient sentiment analysis will appear here once survey data is collected.</p>
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
    </DashboardLayout>
  );
};

export default PatientExperienceCenter;
