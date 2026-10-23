import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
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
  const [createKind, setCreateKind] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | privileges | credentials
  const [stats, setStats] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

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
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 ">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">Medical Affairs Center</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Credentialing & Privileging (C&P) • DOH Medical Director Oversight</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 font-semibold rounded-2xl border border-slate-200 text-[12px] normal-case tracking-normal hover:bg-slate-50 transition-all shadow-sm">
                <FileBadge className="w-4 h-4 text-emerald-600" />
                DOH Dataflow Sync
              </button>
              <button type="button" onClick={() => setCreateKind('clinician')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-95">
                <UserPlus className="w-4 h-4" />
                Add Clinician
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit overflow-x-auto scrollbar-none">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setView(item.id)}
               className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all whitespace-nowrap ${
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <CPDashboard stats={stats} />}
            {view === 'privileges' && <PrivilegeMatrix privileges={privileges} />}
            {view === 'credentials' && (
               <div className="bg-white p-20 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  <Activity className="w-16 h-16 text-slate-800 font-semibold mb-6" />
                  <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">Credential Verification Register</h3>
                  <p className="text-[13px] text-slate-800 font-semibold max-w-sm mt-2">Central log for BLS, ACLS, Malpractice Insurance, and Primary Source Verification (Dataflow).</p>
                  <button type="button" onClick={() => setCreateKind('credential')} className="mt-8 px-8 py-4 bg-slate-100 text-[12px] font-semibold normal-case tracking-normal rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">Upload New Credential</button>
               </div>
            )}
          </div>
        )}
      </div>
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('Record saved successfully', 'success'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default MedicalAffairsCenter;
