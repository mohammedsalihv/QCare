import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import TrainingDashboard from '../components/training/TrainingDashboard';
import StaffComplianceView from '../components/training/StaffComplianceView';
import ComplianceMatrix from '../components/training/ComplianceMatrix';
import { useNotification } from '../components/NotificationContext';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Grid3X3, 
  Plus, 
  FileSpreadsheet,
  Award,
  Search
} from 'lucide-react';

const TrainingCompetencyCenter = () => {
  const { showNotification } = useNotification();
  const [createKind, setCreateKind] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | personal | matrix
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [staff, setStaff] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

      const [statsRes, recordsRes, frameworkRes, staffRes, complianceRes] = await Promise.all([
        axios.get('/api/training/dashboard', config),
        axios.get('/api/training/records', config),
        axios.get('/api/training/framework', config),
        axios.get('/api/users/directory', config),
        axios.get(`/api/training/staff/${userInfo._id}/compliance`, config)
      ]);

      setStats(statsRes.data);
      setRecords(recordsRes.data);
      setCompetencies(frameworkRes.data);
      setStaff(staffRes.data.filter(u => u.role !== 'SuperAdmin'));
      setCompliance(complianceRes.data);
    } catch (error) {
      showNotification(error.response?.data?.message || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/training/export/excel', {
        ...getAuthConfig(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TrainingRegister.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Compliance Dashboard', icon: LayoutDashboard },
    { id: 'personal', label: 'My Competencies', icon: Award },
    { id: 'matrix', label: 'Organization Matrix', icon: Grid3X3, roles: ['QualityManager', 'SuperAdmin', 'DepartmentHead'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(userInfo.role));

  return (
    <DashboardLayout title="Staff Competency & Training">
      <div className="space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 ">
                 <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">DOH Competency Framework</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Skill Verification • Regulatory Compliance • CPD Tracking</p>
              </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleExport}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 font-semibold rounded-2xl border border-slate-200 text-[12px] normal-case tracking-normal hover:bg-slate-50 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export Register
              </button>
              <button type="button" onClick={() => setCreateKind('training')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Log Training
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
           {filteredNav.map((item) => (
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <TrainingDashboard stats={stats} />}
            {view === 'personal' && <StaffComplianceView compliance={compliance} />}
            {view === 'matrix' && <ComplianceMatrix staff={staff} competencies={competencies} records={records} />}
          </div>
        )}
      </div>
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('Record saved successfully', 'success'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default TrainingCompetencyCenter;
