import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuditDashboard from '../components/audit/AuditDashboard';
import AuditConductor from '../components/audit/AuditConductor';
import ImprovementActionTracker from '../components/audit/ImprovementActionTracker';
import { useNotification } from '../components/NotificationContext';
import { Plus, ShieldCheck, ClipboardList, LayoutDashboard, Play, FileDown } from 'lucide-react';

const ClinicalAuditCenter = () => {
  const { showNotification } = useNotification();
  const [view, setView] = useState('dashboard'); // dashboard | audits | actions | conductor
  const [stats, setStats] = useState(null);
  const [audits, setAudits] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, auditsRes] = await Promise.all([
        axios.get('/api/audit/dashboard', config),
        axios.get('/api/audit', config)
      ]);

      setStats(statsRes.data);
      setAudits(auditsRes.data);
    } catch (error) {
      showNotification('Failed to load audit data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartAudit = async (audit) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/audit/${audit._id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveAudit(audit);
      setView('conductor');
    } catch (error) {
      showNotification('Failed to start audit', 'error');
    }
  };

  const handleSaveFindings = async (findings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/audit/${activeAudit._id}/findings`, { findings }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Audit findings saved', 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to save findings', 'error');
    }
  };

  const handleFinalizeAudit = async (findings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/audit/${activeAudit._id}/findings`, { findings }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await axios.put(`/api/audit/${activeAudit._id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Audit finalized and closed', 'success');
      setView('dashboard');
      fetchData();
    } catch (error) {
      showNotification('Failed to finalize audit', 'error');
    }
  };

  const downloadReport = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/audit/${id}/report/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditReport_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      showNotification('Failed to generate report', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Governance Overview', icon: LayoutDashboard },
    { id: 'audits', label: 'Audit Inventory', icon: ClipboardList },
    { id: 'actions', label: 'Action Tracker', icon: ShieldCheck },
  ];

  return (
    <DashboardLayout title="Clinical Audit & Governance">
      <div className="space-y-8 pb-20">
        {/* Navigation Tabs */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex gap-2">
             {navItems.map((item) => (
               <button
                 key={item.id}
                 onClick={() => setView(item.id)}
                 className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === item.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 <item.icon className="w-4 h-4" />
                 {item.label}
               </button>
             ))}
           </div>
           <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
             <Plus className="w-4 h-4" />
             Schedule New Audit
           </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && <AuditDashboard stats={stats} />}
            
            {view === 'audits' && (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Details</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Governance Pillar</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{audit.auditTitle}</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase">{audit.department}</span>
                           </div>
                        </td>
                        <td className="p-6">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase">
                             {audit.governancePillar?.replace('-', ' ')}
                           </span>
                        </td>
                        <td className="p-6 text-xs font-bold text-slate-600">
                           {new Date(audit.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="p-6">
                           <span className={`text-sm font-black ${audit.overallScore >= 80 ? 'text-emerald-600' : audit.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                             {audit.overallScore || 0}%
                           </span>
                        </td>
                        <td className="p-6">
                           <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${
                             audit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                             audit.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                           }`}>
                             {audit.status}
                           </span>
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex justify-end gap-3">
                              {audit.status !== 'completed' ? (
                                <button
                                  onClick={() => handleStartAudit(audit)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Start/Continue Audit"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => downloadReport(audit._id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Download Report"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === 'actions' && (
              <ImprovementActionTracker 
                actions={audits.flatMap(a => a.improvementActions || [])}
                onUpdateStatus={(id, status) => showNotification('Feature coming soon!', 'info')}
              />
            )}

            {view === 'conductor' && (
              <div className="space-y-6">
                 <button 
                   onClick={() => setView('audits')}
                   className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
                 >
                   ← Back to Inventory
                 </button>
                 <AuditConductor 
                   audit={activeAudit}
                   onSaveFindings={handleSaveFindings}
                   onFinalize={handleFinalizeAudit}
                 />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClinicalAuditCenter;
