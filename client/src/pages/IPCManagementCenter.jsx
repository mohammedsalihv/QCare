import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import IPCDashboard from '../components/ipc/IPCDashboard';
import HandHygieneTracker from '../components/ipc/HandHygieneTracker';
import OutbreakManager from '../components/ipc/OutbreakManager';
import { useNotification } from '../components/NotificationContext';
import { 
  ShieldCheck, 
  Droplets, 
  Activity, 
  LayoutDashboard, 
  Plus, 
  AlertTriangle,
  FileSpreadsheet,
  Grid3X3
} from 'lucide-react';

const IPCManagementCenter = () => {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard'); // dashboard | surveillance | hygiene | outbreaks
  const [stats, setStats] = useState(null);
  const [hygieneTrend, setHygieneTrend] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, hygieneRes, outbreaksRes] = await Promise.all([
        axios.get('/api/ipc/surveillance/dashboard', config),
        axios.get('/api/ipc/hand-hygiene/trend', config),
        axios.get('/api/ipc/outbreaks', config)
      ]);

      setStats(statsRes.data);
      setHygieneTrend(hygieneRes.data);
      setOutbreaks(outbreaksRes.data);
    } catch (error) {
      showNotification('Failed to load IPC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'IPC Dashboard', icon: LayoutDashboard },
    { id: 'hygiene', label: 'Hand Hygiene Audit', icon: Droplets },
    { id: 'outbreaks', label: 'Outbreak Response', icon: AlertTriangle },
    { id: 'surveillance', label: 'HAI Surveillance', icon: Activity },
  ];

  return (
    <DashboardLayout title="Infection Prevention & Control">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-200 dark:shadow-none">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">IPC Command Center</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">HAI Surveillance • Outbreak Response • Environmental Safety</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                DOH IPC Report
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Log Monthly Data
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm w-fit overflow-x-auto scrollbar-none">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setView(item.id)}
               className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
            {view === 'dashboard' && <IPCDashboard stats={stats} />}
            {view === 'hygiene' && <HandHygieneTracker trendData={hygieneTrend} />}
            {view === 'outbreaks' && <OutbreakManager outbreaks={outbreaks} onSelect={(id) => {}} />}
            {view === 'surveillance' && (
              <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                 <Grid3X3 className="w-16 h-16 text-slate-200 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">HAI Surveillance Register</h3>
                 <p className="text-xs text-slate-400 max-w-sm mt-2">Comprehensive month-by-month log of infection rates across wards with national benchmark comparison.</p>
                 <button className="mt-8 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl">Access Full Register</button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IPCManagementCenter;
