import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Filter, Search } from 'lucide-react';
import KPIDashboard from '../components/kpi/KPIDashboard';
import KPITable from '../components/kpi/KPITable';
import KPIForm from '../components/kpi/KPIForm';
import KPIExportButton from '../components/kpi/KPIExportButton';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';

const JawdaKPI = () => {
  const { showNotification, confirm } = useNotification();
  const [kpis, setKpis] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [filters, setFilters] = useState({
    period: 'Q1',
    year: new Date().getFullYear(),
    status: '',
    category: ''
  });

  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isQualityManager = user.role === 'QualityManager' || user.role === 'SuperAdmin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [kpisRes, dashboardRes] = await Promise.all([
        axios.get('/api/kpi', { params: filters, ...config }),
        axios.get('/api/kpi/dashboard', { params: { period: filters.period, year: filters.year }, ...config })
      ]);

      setKpis(kpisRes.data);
      setDashboardData(dashboardRes.data);
    } catch (error) {
      showNotification('Failed to fetch KPI data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleEdit = (kpi) => {
    setSelectedKpi(kpi);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedKpi(null);
    setIsFormOpen(true);
  };

  const handleSubmitToDOH = async (id) => {
    confirm({
      title: 'Submit to DOH',
      message: 'Are you sure you want to submit this KPI to DOH? This action will be logged.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`/api/kpi/${id}/submit`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showNotification('Successfully submitted to DOH', 'success');
          fetchData();
        } catch (error) {
          showNotification('Submission failed', 'error');
        }
      }
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout title="Jawda KPI Reporting">
      <div className="space-y-8 pb-10">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="Q1">Quarter 1</option>
                <option value="Q2">Quarter 2</option>
                <option value="Q3">Quarter 3</option>
                <option value="Q4">Quarter 4</option>
              </select>
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <input
              type="number"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-24 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <KPIExportButton period={filters.period} year={filters.year} />
            {isQualityManager && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Indicator
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Section */}
        {dashboardData && (
          <KPIDashboard 
            stats={dashboardData.stats} 
            trend={dashboardData.trend} 
            topBreached={dashboardData.topBreached} 
          />
        )}

        {/* Filters and Table Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Status:</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none"
              >
                <option value="">All Status</option>
                <option value="on-track">On Track</option>
                <option value="at-risk">At Risk</option>
                <option value="breached">Breached</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Category:</span>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none"
              >
                <option value="">All Categories</option>
                <option value="patient-safety">Patient Safety</option>
                <option value="clinical-effectiveness">Clinical Effectiveness</option>
                <option value="patient-experience">Patient Experience</option>
                <option value="efficiency">Efficiency</option>
                <option value="access">Access</option>
              </select>
            </div>
          </div>

          <KPITable 
            kpis={kpis} 
            onEdit={handleEdit} 
            onSubmit={handleSubmitToDOH}
            userRole={user.role}
          />
        </div>

        {/* Modal Form */}
        <KPIForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSave={fetchData}
          kpiData={selectedKpi}
        />
      </div>
    </DashboardLayout>
  );
};

export default JawdaKPI;
