import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
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
  const [createKind, setCreateKind] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | assets | drills
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

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
              <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-slate-200 ">
                 <Building2 className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">Facility Safety Command</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Bio-Med Calibration • Mock Drills • PPM Monitoring</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 font-semibold rounded-2xl border border-slate-200 text-[12px] normal-case tracking-normal hover:bg-slate-50 transition-all shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Audit Report
              </button>
              <button type="button" onClick={() => setCreateKind('asset')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Add Asset
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
                 view === item.id ? 'bg-primary text-white shadow-lg' : 'text-slate-800 font-semibold hover:text-slate-800 hover:bg-white/5'
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
                   <div key={drill._id} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-3 rounded-xl ${drill.drillType.includes('Fire') ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-800'}`}>
                            <Siren className="w-5 h-5" />
                         </div>
                         <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{new Date(drill.drillDate).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight mb-2">{drill.drillType}</h3>
                      <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-6">{drill.location}</p>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[12px] font-semibold normal-case tracking-normal">
                            <span className="text-slate-800 font-semibold">Response Time</span>
                            <span className="text-slate-800 font-semibold ">{drill.responseTimeSeconds} Seconds</span>
                         </div>
                         <div className="flex justify-between text-[12px] font-semibold normal-case tracking-normal">
                            <span className="text-slate-800 font-semibold">Evaluation</span>
                            <span className="text-slate-800">{drill.overallRating} / 5</span>
                         </div>
                      </div>
                   </div>
                 ))}
                 <button type="button" onClick={() => setCreateKind('drill')} className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 group hover:border-slate-900 transition-all">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <Plus className="w-6 h-6 text-slate-800 font-semibold group-hover:text-slate-800" />
                    </div>
                    <span className="mt-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal group-hover:text-slate-800">Log Mock Drill</span>
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('Record saved successfully', 'success'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default FMSManagementCenter;
