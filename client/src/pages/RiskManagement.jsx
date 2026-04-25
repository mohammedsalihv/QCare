import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import Dropdown from '../components/Dropdown';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ShieldAlert, 
  AlertTriangle,
  FileEdit,
  Trash2,
  Filter,
  X,
  Target,
  BarChart3,
  Calendar,
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  History
} from 'lucide-react';

const RiskManagement = () => {
  const [risks, setRisks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRisk, setCurrentRisk] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Clinical',
    department: '',
    probability: 3,
    impact: 3,
    mitigationStrategy: '',
    owner: '',
    status: 'Identified',
    reviewDate: ''
  });

  const categories = ['Clinical', 'Operational', 'Financial', 'Strategic', 'Compliance', 'Environmental'];
  const statuses = ['Identified', 'Mitigated', 'Transferred', 'Accepted', 'Closed'];

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    } else {
      const { role } = JSON.parse(userInfo);
      if (role !== 'admin' && role !== 'superadmin') {
        navigate('/dashboard');
      }
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
      const [risksRes, usersRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/risks', getAuthConfig()),
        axios.get('http://localhost:5000/api/users', getAuthConfig()),
        axios.get('http://localhost:5000/api/departments', getAuthConfig())
      ]);
      setRisks(risksRes.data);
      setUsers(usersRes.data.map(u => ({ label: u.employeeName, value: u._id })));
      setDepartments(deptsRes.data.map(d => ({ label: d.name, value: d.name })));
    } catch (err) {
      showNotification('Error fetching risk data', 'error');
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
      title: '',
      description: '',
      category: 'Clinical',
      department: departments[0]?.value || '',
      probability: 3,
      impact: 3,
      mitigationStrategy: '',
      owner: users[0]?.value || '',
      status: 'Identified',
      reviewDate: ''
    });
    setIsEditing(false);
    setCurrentRisk(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (risk) => {
    setCurrentRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      department: risk.department,
      probability: risk.probability,
      impact: risk.impact,
      mitigationStrategy: risk.mitigationStrategy,
      owner: risk.owner?._id || '',
      status: risk.status,
      reviewDate: risk.reviewDate ? new Date(risk.reviewDate).toISOString().split('T')[0] : ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (risk) => {
    confirm({
      title: 'Delete Risk Record',
      message: `Are you sure you want to permanently remove risk: "${risk.title}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/risks/${risk._id}`, getAuthConfig());
          showNotification('Risk record deleted successfully', 'success');
          fetchData();
        } catch (err) {
          showNotification('Error deleting risk', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/risks/${currentRisk._id}`, formData, getAuthConfig());
        showNotification('Risk assessment updated', 'success');
      } else {
        await axios.post('http://localhost:5000/api/risks', formData, getAuthConfig());
        showNotification('New risk identified and recorded', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving risk', 'error');
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 15) return { label: 'Extreme', color: 'bg-rose-600', text: 'text-rose-600', bg: 'bg-rose-50' };
    if (score >= 10) return { label: 'High', color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50' };
    if (score >= 5) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' };
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = risks.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Quality Assurance</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Risk Management</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Enterprise Risk Register</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#b59662] hover:bg-[#a68959] text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-[#b59662]/30 active:scale-95 uppercase tracking-wide"
          >
             <Plus className="w-4 h-4" />
             <span>Log New Risk</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Risks', value: risks.length, icon: ShieldAlert, color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Extreme Risks', value: risks.filter(r => r.probability * r.impact >= 15).length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Mitigated', value: risks.filter(r => r.status === 'Mitigated').length, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending Review', value: risks.filter(r => r.status === 'Identified').length, icon: History, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-[450px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by risk title, description or owner..."
                 className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-semibold shadow-inner-sm"
               />
            </div>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-all active:scale-95">
                  <Filter className="w-3.5 h-3.5" />
                  Filter Risks
               </button>
               <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-all active:scale-95">
                  <BarChart3 className="w-3.5 h-3.5" />
                  View Matrix
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-1/4 px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">Risk Identification</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">Assessment</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">Owner & Dept</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">Next Review</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="w-36 px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((risk) => {
                  const level = getRiskLevel(risk.score);
                  return (
                    <tr key={risk._id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${level.bg} flex items-center justify-center font-black ${level.text} border border-current/10 shadow-sm`}>
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{risk.title}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{risk.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${level.color} text-white`}>{level.label}</span>
                               <span className="text-xs font-black text-slate-900">{risk.score} <span className="text-slate-400 font-bold text-[10px]">Matrix Score</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                               <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> P: {risk.probability}</span>
                               <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> I: {risk.impact}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                               <User className="w-3 h-3 text-slate-300" />
                               <span className="text-xs font-bold text-slate-700">{risk.owner?.employeeName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Building2 className="w-3 h-3 text-slate-300" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{risk.department}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-[#b59662]" />
                            <span className="text-xs font-bold">{risk.reviewDate ? new Date(risk.reviewDate).toLocaleDateString() : 'N/A'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-600`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${risk.status === 'Closed' ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                            {risk.status}
                         </span>
                      </td>
                      <td className="px-6 py-6 text-right pr-10">
                         <div className="flex items-center justify-end gap-2.5">
                            <button 
                              onClick={() => handleEditClick(risk)}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-[#b59662] hover:border-[#b59662] hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
                            >
                               <FileEdit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(risk)}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={risks.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b59662] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[#b59662]/5 flex items-center justify-center border border-[#b59662]/10 shadow-inner">
                      <ShieldAlert className="w-7 h-7 text-[#b59662]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {isEditing ? 'Refine Risk Assessment' : 'New Risk Entry'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight uppercase tracking-widest opacity-60">Proactive Healthcare Quality Assurance</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Risk Title / Identification</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Failure of redundant backup power in OT" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 shadow-inner-sm" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Category</label>
                    <Dropdown 
                      options={categories.map(c => ({ label: c, value: c }))}
                      value={formData.category}
                      onSelect={(val) => setFormData({...formData, category: val})}
                      fullWidth
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Assigned Department</label>
                    <Dropdown 
                      options={departments}
                      value={formData.department}
                      onSelect={(val) => setFormData({...formData, department: val})}
                      fullWidth
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Risk Owner (PIC)</label>
                    <Dropdown 
                      options={users}
                      value={formData.owner}
                      onSelect={(val) => setFormData({...formData, owner: val})}
                      fullWidth
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Next Review Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input type="date" name="reviewDate" value={formData.reviewDate} onChange={handleInputChange} className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Status</label>
                      <Dropdown 
                        options={statuses.map(s => ({ label: s, value: s }))}
                        value={formData.status}
                        onSelect={(val) => setFormData({...formData, status: val})}
                        fullWidth
                      />
                    </div>
                  )}

                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Probability (1-5)</label>
                          <span className="text-xl font-black text-[#b59662]">{formData.probability}</span>
                       </div>
                       <input 
                         type="range" min="1" max="5" step="1"
                         name="probability" value={formData.probability} onChange={handleInputChange}
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#b59662]"
                       />
                       <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          <span>Rare</span>
                          <span>Unlikely</span>
                          <span>Possible</span>
                          <span>Likely</span>
                          <span>Certain</span>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Impact Severity (1-5)</label>
                          <span className="text-xl font-black text-rose-500">{formData.impact}</span>
                       </div>
                       <input 
                         type="range" min="1" max="5" step="1"
                         name="impact" value={formData.impact} onChange={handleInputChange}
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                       />
                       <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          <span>Minor</span>
                          <span>Moderate</span>
                          <span>Serious</span>
                          <span>Major</span>
                          <span>Catastrophic</span>
                       </div>
                    </div>
                    <div className="md:col-span-2 pt-4 flex items-center justify-center gap-4 border-t border-slate-200/60">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Calculated Risk Score:</span>
                       <div className={`px-6 py-2 rounded-xl text-lg font-black text-white shadow-lg ${getRiskLevel(formData.probability * formData.impact).color}`}>
                          {formData.probability * formData.impact} - {getRiskLevel(formData.probability * formData.impact).label}
                       </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Mitigation Strategy & Action Plan</label>
                    <textarea name="mitigationStrategy" value={formData.mitigationStrategy} onChange={handleInputChange} rows="3" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm" placeholder="Detailed steps to reduce probability or impact..."></textarea>
                  </div>
                </div>

                <div className="flex gap-6 pt-8 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all border border-slate-200 uppercase tracking-[0.2em] active:scale-95">
                     Cancel Entry
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-[#b59662] to-[#9e8254] text-white text-[10px] font-black rounded-2xl shadow-2xl shadow-[#b59662]/30 hover:shadow-3xl hover:from-[#a68959] hover:to-[#8f754b] transition-all active:scale-[0.98] uppercase tracking-[0.2em]">
                     {isEditing ? 'Authorize Changes' : 'Initialize Risk Profile'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-slate-200 text-slate-400 relative overflow-hidden">
           <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-[#b59662]/5 rounded-lg border border-[#b59662]/10">
                <Target className="w-4 h-4 text-[#b59662]" />
              </div>
              <span className="text-[10px] font-black tracking-[0.1em] text-slate-500 uppercase">Strategic Risk Monitor - Enterprise Edition</span>
           </div>
           <div className="flex items-center gap-4 relative z-10">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">System Security: Verified</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RiskManagement;
