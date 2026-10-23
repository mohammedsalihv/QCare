import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
import Table from '../components/Table.jsx';
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
  const [createKind, setCreateKind] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | audits | actions | conductor
  const [stats, setStats] = useState(null);
  const [audits, setAudits] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [loading, setLoading] = useState(true);



  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

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
      await axios.put(`/api/audit/${audit._id}/start`, {}, {
        ...getAuthConfig()
      });
      const { data } = await axios.get(`/api/audit/${audit._id}`, getAuthConfig());
      setActiveAudit(data);
      setView('conductor');
    } catch (error) {
      showNotification('Failed to start audit', 'error');
    }
  };

  const handleSaveFindings = async (findings) => {
    try {
      await axios.put(`/api/audit/${activeAudit._id}/findings`, { findings }, {
        ...getAuthConfig()
      });
      showNotification('Audit findings saved', 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to save findings', 'error');
    }
  };

  const handleFinalizeAudit = async (findings) => {
    try {
      await axios.put(`/api/audit/${activeAudit._id}/findings`, { findings }, {
        ...getAuthConfig()
      });
      await axios.put(`/api/audit/${activeAudit._id}/complete`, {}, {
        ...getAuthConfig()
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
      const response = await axios.get(`/api/audit/${id}/report/pdf`, {
        ...getAuthConfig(),
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
        <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex gap-2">
             {navItems.map((item) => (
               <button
                 key={item.id}
                 onClick={() => setView(item.id)}
                 className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all ${
                   view === item.id ? 'bg-primary text-white shadow-lg shadow-slate-200' : 'text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-50'
                 }`}
               >
                 <item.icon className="w-4 h-4" />
                 {item.label}
               </button>
             ))}
           </div>
           <button type="button" onClick={() => setCreateKind('audit')} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-lg shadow-[#040404]/20 hover:bg-primary transition-all">
             <Plus className="w-4 h-4" />
             Schedule New Audit
           </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#040404]"></div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && <AuditDashboard stats={stats} />}
            
            {view === 'audits' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <Table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Audit Details</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Governance Pillar</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Date</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Score</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-slate-800 ">{audit.auditTitle}</span>
                             <span className="text-[12px] font-semibold text-slate-800 normal-case">{audit.department}</span>
                           </div>
                        </td>
                        <td className="p-6">
                           <span className="px-3 py-1 bg-slate-100 text-slate-800 text-[12px] font-semibold rounded-lg normal-case">
                             {audit.governancePillar?.replace('-', ' ')}
                           </span>
                        </td>
                        <td className="p-6 text-[13px] font-semibold text-slate-800">
                           {new Date(audit.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="p-6">
                           <span className={`text-sm font-semibold ${audit.overallScore >= 80 ? 'text-emerald-600' : audit.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                             {audit.overallScore || 0}%
                           </span>
                        </td>
                        <td className="p-6">
                           <span className={`px-3 py-1 text-[12px] font-semibold rounded-full normal-case tracking-normal ${
                             audit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                             audit.status === 'in-progress' ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-800 font-semibold'
                           }`}>
                             {audit.status}
                           </span>
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex justify-end gap-3">
                              {audit.status !== 'completed' ? (
                                <button
                                  onClick={() => handleStartAudit(audit)}
                                  className="p-2 text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
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
                </Table>
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
                   className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal hover:text-slate-800 transition-all"
                 >
                   ← Back to Inventory
                 </button>
                 <AuditConductor 
                   key={activeAudit._id}
                   audit={activeAudit}
                   onSaveFindings={handleSaveFindings}
                   onFinalize={handleFinalizeAudit}
                 />
              </div>
            )}
          </>
        )}
      </div>
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('Audit scheduled successfully', 'success'); setView('audits'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default ClinicalAuditCenter;
