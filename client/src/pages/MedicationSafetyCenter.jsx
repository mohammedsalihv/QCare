import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import MedicationSafetyDashboard from '../components/meds/MedicationSafetyDashboard';
import HighAlertMedicationList from '../components/meds/HighAlertMedicationList';
import WasteRegisterTable from '../components/meds/WasteRegisterTable';
import { useNotification } from '../components/NotificationContext';
import { 
  ShieldCheck, 
  Pill, 
  Trash2, 
  LayoutDashboard, 
  Plus, 
  FileText,
  Activity,
  ClipboardList
} from 'lucide-react';

const MedicationSafetyCenter = () => {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard'); // dashboard | formulary | waste | errors
  const [stats, setStats] = useState(null);
  const [medications, setMedications] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, medsRes, wasteRes] = await Promise.all([
        axios.get('/api/medication/errors/dashboard', config),
        axios.get('/api/medication/high-alert', config),
        axios.get('/api/medication/waste', config)
      ]);

      setStats(statsRes.data);
      setMedications(medsRes.data);
      setWasteLogs(wasteRes.data);
    } catch (error) {
      showNotification('Failed to load medication safety data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadManifest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/medication/waste/${id}/manifest/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Manifest_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      showNotification('PDF generation failed', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Safety Dashboard', icon: LayoutDashboard },
    { id: 'formulary', label: 'High-Alert Formulary', icon: ShieldCheck },
    { id: 'waste', label: 'Waste Disposal', icon: Trash2 },
    { id: 'errors', label: 'Error Reporting', icon: Activity },
  ];

  return (
    <DashboardLayout title="Medication Safety & Medical Waste">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-600 text-white rounded-[2rem] shadow-xl shadow-rose-200 dark:shadow-none">
                 <Pill className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Pharma Safety Command</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Error Prevention • High-Alert Verification • 2025 Waste Standard</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <ClipboardList className="w-4 h-4 text-rose-600" />
                DOH Audit Log
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Report Incident
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <MedicationSafetyDashboard stats={stats} />}
            {view === 'formulary' && <HighAlertMedicationList medications={medications} />}
            {view === 'waste' && <WasteRegisterTable wasteLogs={wasteLogs} onDownloadManifest={handleDownloadManifest} />}
            {view === 'errors' && (
              <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                 <FileText className="w-16 h-16 text-slate-200 mb-6" />
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Medication Error Register</h3>
                 <p className="text-xs text-slate-400 max-w-sm mt-2">Classified log of all near-misses and medication administration errors for root cause analysis.</p>
                 <button className="mt-8 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl">Access Full Register</button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicationSafetyCenter;
