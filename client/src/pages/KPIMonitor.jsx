import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  ChevronRight,
  BarChart3,
  FileEdit,
  Trash2,
  Building2,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Calendar,
  Filter,
  ArrowUpRight
} from 'lucide-react';

const KPIMonitor = () => {
  const [kpis, setKpis] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Clinical',
    department: '',
    actualValue: 0,
    targetValue: 0,
    unit: '%',
    period: 'Monthly',
    description: '',
    status: 'Not Started'
  });

  const categories = ['Clinical', 'Operational', 'Financial', 'Patient Experience', 'Staff Safety'];
  const periods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
  const statuses = ['On Track', 'Off Track', 'Critical', 'Not Started'];

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    }
  }, [navigate]);

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchData = async () => {
    try {
      const [kpisRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/kpis', getAuthConfig()),
        axios.get('http://localhost:5000/api/departments', getAuthConfig())
      ]);
      setKpis(kpisRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Clinical',
      department: departments[0]?._id || '',
      actualValue: 0,
      targetValue: 0,
      unit: '%',
      period: 'Monthly',
      description: '',
      status: 'Not Started'
    });
    setIsEditing(false);
    setCurrentKpi(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (kpi) => {
    setCurrentKpi(kpi);
    setFormData({
      name: kpi.name,
      category: kpi.category,
      department: kpi.department?._id || '',
      actualValue: kpi.actualValue,
      targetValue: kpi.targetValue,
      unit: kpi.unit,
      period: kpi.period,
      description: kpi.description || '',
      status: kpi.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      try {
        await axios.delete(`http://localhost:5000/api/kpis/${id}`, getAuthConfig());
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting KPI');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/kpis/${currentKpi._id}`, formData, getAuthConfig());
      } else {
        await axios.post('http://localhost:5000/api/kpis', formData, getAuthConfig());
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving KPI');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-500';
      case 'Off Track': return 'bg-amber-500';
      case 'Critical': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Off Track': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = kpis.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Analytics</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">KPI Monitor</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">KPI Performance Monitor</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span>Define New KPI</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total KPIs', value: kpis.length, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'On Track', value: kpis.filter(k => k.status === 'On Track').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Off Track', value: kpis.filter(k => k.status === 'Off Track').length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Critical', value: kpis.filter(k => k.status === 'Critical').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full lg:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search KPI by name or category..."
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-semibold"
               />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Filters</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">KPI Metric</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Department</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Target vs Actual</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Period</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((kpi) => {
                  const progress = Math.min((kpi.actualValue / kpi.targetValue) * 100, 100);
                  return (
                    <tr key={kpi._id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-400 text-[10px]`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 leading-snug">{kpi.name}</span>
                            <span className="text-[11px] font-medium text-slate-400 tracking-tighter">{kpi.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Building2 className="w-3.5 h-3.5 text-slate-300" />
                           <span className="text-xs text-slate-600">{kpi.department?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between text-[10px] font-medium">
                               <span className="text-slate-400">Target: {kpi.targetValue}{kpi.unit}</span>
                               <span className="text-slate-900">{kpi.actualValue}{kpi.unit}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${getStatusColor(kpi.status)} transition-all duration-1000`} 
                                 style={{ width: `${progress}%` }}
                               ></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-slate-300" />
                             <span className="text-sm text-slate-500">{kpi.period}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider border ${getStatusBg(kpi.status)}`}>
                             {kpi.status}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                         <div className="flex items-center justify-end gap-2.5">
                            <button 
                              onClick={() => handleEditClick(kpi)}
                              className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all duration-300 active:scale-95"
                            >
                               <FileEdit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(kpi._id)}
                              className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-all duration-300 active:scale-95"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )
                })}
                {kpis.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="px-7 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <BarChart3 className="w-12 h-12" />
                        <span className="text-xs font-bold uppercase tracking-widest">No KPIs discovered yet</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={kpis.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b59662] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[#b59662]/5 flex items-center justify-center border border-[#b59662]/10 shadow-inner">
                      <Target className="w-7 h-7 text-[#b59662]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'Refine KPI Setup' : 'Define Performance Metric'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Corporate quality standards & tracking</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-6 bg-white overflow-y-auto max-h-[70vh] scrollbar-none">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">KPI Title/Measure</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Patient Satisfaction Score" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800">
                      <option value="">Select Department</option>
                      {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Target Value</label>
                    <input type="number" name="targetValue" value={formData.targetValue} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Actual Value</label>
                    <input type="number" name="actualValue" value={formData.actualValue} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Unit</label>
                    <input name="unit" value={formData.unit} onChange={handleInputChange} required placeholder="%, min, USD, etc." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Tracking Period</label>
                    <select name="period" value={formData.period} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800">
                      {periods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Current Status</label>
                    <div className="grid grid-cols-4 gap-3">
                      {statuses.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, status: s})}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${
                            formData.status === s 
                            ? getStatusBg(s) + ' border-transparent ring-2 ring-offset-2 ring-slate-200' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Description / Notes</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800 resize-none" placeholder="Add calculation formula or context..."></textarea>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white text-sm font-bold rounded-md shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Apply Changes' : 'Initialize Performance Metric'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-400">
           <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#b59662]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">QCare Clinical Analytics Engine</span>
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest">Enterprise KPIs v2.4</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KPIMonitor;
