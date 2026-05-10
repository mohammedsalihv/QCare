import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import CPDashboard from '../components/cp/CPDashboard';
import PrivilegeMatrix from '../components/cp/PrivilegeMatrix';
import { useNotification } from '../components/NotificationContext';
import { 
  Heart, 
  LayoutDashboard, 
  ShieldCheck, 
  FileCheck, 
  Plus, 
  UserPlus,
  Activity,
  FileBadge
} from 'lucide-react';

const MedicalAffairsCenter = () => {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard'); // dashboard | privileges | credentials
  const [stats, setStats] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, privRes] = await Promise.all([
        axios.get('/api/cp/dashboard', config),
        axios.get('/api/cp/privileges', config)
      ]);

      setStats(statsRes.data);
      setPrivileges(privRes.data);
    } catch (error) {
      showNotification('Failed to load Medical Affairs data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'C&P Overview', icon: LayoutDashboard },
    { id: 'privileges', label: 'Clinical Privileges', icon: ShieldCheck },
    { id: 'credentials', label: 'Credential Registry', icon: FileBadge },
  ];

  return (
    <DashboardLayout title="Medical Affairs & Credentialing">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-200 dark:shadow-none">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Medical Affairs Center</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Credentialing & Privileging (C&P) • DOH Medical Director Oversight</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <FileBadge className="w-4 h-4 text-emerald-600" />
                DOH Dataflow Sync
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                <UserPlus className="w-4 h-4" />
                Add Clinician
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <CPDashboard stats={stats} />}
            {view === 'privileges' && <PrivilegeMatrix privileges={privileges} />}
            {view === 'credentials' && (
               <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                  <Activity className="w-16 h-16 text-slate-200 mb-6" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Credential Verification Register</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-2">Central log for BLS, ACLS, Malpractice Insurance, and Primary Source Verification (Dataflow).</p>
                  <button className="mt-8 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">Upload New Credential</button>
               </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicalAffairsCenter;
