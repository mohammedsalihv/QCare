import { getAuthConfig } from '../utils/authConfig';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import RiskDashboard from '../components/risk/RiskDashboard';
import RiskMatrix from '../components/risk/RiskMatrix';
import RiskRegisterTable from '../components/risk/RiskRegisterTable';
import RiskForm from '../components/risk/RiskForm';
import { useNotification } from '../components/NotificationContext';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  FileSpreadsheet, 
  Grid3X3, 
  LayoutDashboard, 
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

const RiskManagementCenter = () => {
  const { showNotification } = useNotification();
  const location = useLocation();
  const [view, setView] = useState('dashboard'); // dashboard | matrix | register
  const [stats, setStats] = useState(null);
  const [matrixData, setMatrixData] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();

      const [statsRes, matrixRes, risksRes] = await Promise.all([
        axios.get('/api/risks/dashboard', config),
        axios.get('/api/risks/matrix', config),
        axios.get('/api/risks', config)
      ]);

      setStats(statsRes.data);
      setMatrixData(Array.isArray(matrixRes.data) ? matrixRes.data : []);
      setRisks(Array.isArray(risksRes.data) ? risksRes.data : []);
    } catch (error) {
      showNotification('Failed to load risk data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setPrefillData({
        riskTitle: params.get('title') || '',
        description: params.get('desc') || '',
        department: params.get('dept') || '',
        impact: parseInt(params.get('impact')) || 3
      });
      setShowForm(true);
    }
  }, [location]);

  const handleSaveRisk = async (formData) => {
    try {

      await axios.post('/api/risks', formData, getAuthConfig());
      showNotification('Risk registered successfully', 'success');
      setShowForm(false);
      fetchData();
    } catch (error) {
      showNotification('Failed to register risk', 'error');
    }
  };

  const handleExport = async () => {
    try {

      const response = await axios.get('/api/risks/export/excel', {
        ...getAuthConfig(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'RiskRegister.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'matrix', label: 'Heatmap Matrix', icon: Grid3X3 },
    { id: 'register', label: 'Risk Register', icon: ClipboardList },
  ];

  return (
    <DashboardLayout title="Risk Management & Safety">
      <div className="space-y-8 pb-20">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                 <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">Enterprise Risk Control</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Identification • Assessment • Mitigation</p>
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
              <button 
                onClick={() => { setPrefillData(null); setShowForm(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Identify New Risk
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#040404]"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <RiskDashboard stats={stats} />}
            {view === 'matrix' && <RiskMatrix matrixData={matrixData} onSelectRisk={(id) => setView('register')} />}
            {view === 'register' && <RiskRegisterTable risks={risks} onView={(id) => {}} onEdit={(id) => {}} />}
          </div>
        )}
      </div>

      <RiskForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSave={handleSaveRisk}
        initialData={prefillData}
      />
    </DashboardLayout>
  );
};

export default RiskManagementCenter;
