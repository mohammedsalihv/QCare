import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import FMSDashboard from '../components/fms/FMSDashboard';
import AssetRegisterTable from '../components/fms/AssetRegisterTable';
import { useNotification } from '../components/NotificationContext';
import { 
  Building2, 
  LayoutDashboard, 
  Wrench, 
  Siren, 
  Plus, 
  Settings,
  History,
  FileSpreadsheet
} from 'lucide-react';

const FMSManagementCenter = () => {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard'); // dashboard | assets | drills
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, assetsRes, drillsRes] = await Promise.all([
        axios.get('/api/fms/dashboard', config),
        axios.get('/api/fms/assets', config),
        axios.get('/api/fms/drills', config)
      ]);

      setStats(statsRes.data);
      setAssets(assetsRes.data);
      setDrills(drillsRes.data);
    } catch (error) {
      showNotification('Failed to load FMS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'FMS Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Biomedical Register', icon: Wrench },
    { id: 'drills', label: 'Mock Drills & Safety', icon: Siren },
  ];

  return (
    <DashboardLayout title="Facility Management & Safety">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-200 dark:shadow-none">
                 <Building2 className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Facility Safety Command</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bio-Med Calibration • Mock Drills • PPM Monitoring</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Audit Report
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Add Asset
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
                 view === item.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white/5'
               }`}
             >
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
           ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <FMSDashboard stats={stats} />}
            {view === 'assets' && <AssetRegisterTable assets={assets} onMaintenance={(a) => {}} onHistory={(id) => {}} />}
            {view === 'drills' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {drills.map((drill) => (
                   <div key={drill._id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-3 rounded-xl ${drill.drillType.includes('Fire') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Siren className="w-5 h-5" />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(drill.drillDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{drill.drillType}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{drill.location}</p>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Response Time</span>
                            <span className="text-slate-900 dark:text-white">{drill.responseTimeSeconds} Seconds</span>
                         </div>
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Evaluation</span>
                            <span className="text-blue-600">{drill.overallRating} / 5</span>
                         </div>
                      </div>
                   </div>
                 ))}
                 <button className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 group hover:border-slate-900 transition-all">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-900" />
                    </div>
                    <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900">Log Mock Drill</span>
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FMSManagementCenter;
