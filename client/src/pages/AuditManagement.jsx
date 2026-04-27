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
  CheckCircle2, 
  Clock,
  FileEdit,
  Trash2,
  Filter,
  X,
  Calendar,
  User,
  Building2,
  FileText,
  FileCheck,
  AlertCircle,
  MoreVertical,
  ArrowUpRight
} from 'lucide-react';

const AuditManagement = () => {
  const [audits, setAudits] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    auditDate: '',
    auditor: '',
    status: 'Scheduled',
    checklist: [
      { item: 'Infection Control Protocols', status: 'Not Applicable', observations: '' },
      { item: 'Staff Competency Records', status: 'Not Applicable', observations: '' },
      { item: 'Equipment Maintenance Logs', status: 'Not Applicable', observations: '' },
      { item: 'Patient Consent Forms', status: 'Not Applicable', observations: '' }
    ],
    summary: '',
    recommendations: ''
  });

  const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

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
      const [auditsRes, usersRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/audits', getAuthConfig()),
        axios.get('http://localhost:5000/api/users', getAuthConfig()),
        axios.get('http://localhost:5000/api/departments', getAuthConfig())
      ]);
      setAudits(auditsRes.data);
      setUsers(usersRes.data.map(u => ({ label: u.employeeName, value: u._id })));
      setDepartments(deptsRes.data.map(d => ({ label: d.name, value: d.name })));
    } catch (err) {
      showNotification('Error fetching audit data', 'error');
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

  const handleChecklistChange = (index, field, value) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index][field] = value;
    setFormData({ ...formData, checklist: newChecklist });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: departments[0]?.value || '',
      auditDate: '',
      auditor: users[0]?.value || '',
      status: 'Scheduled',
      checklist: [
        { item: 'Infection Control Protocols', status: 'Not Applicable', observations: '' },
        { item: 'Staff Competency Records', status: 'Not Applicable', observations: '' },
        { item: 'Equipment Maintenance Logs', status: 'Not Applicable', observations: '' },
        { item: 'Patient Consent Forms', status: 'Not Applicable', observations: '' }
      ],
      summary: '',
      recommendations: ''
    });
    setIsEditing(false);
    setCurrentAudit(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (audit) => {
    setCurrentAudit(audit);
    setFormData({
      title: audit.title,
      department: audit.department,
      auditDate: audit.auditDate ? new Date(audit.auditDate).toISOString().split('T')[0] : '',
      auditor: audit.auditor?._id || '',
      status: audit.status,
      checklist: audit.checklist || [],
      summary: audit.summary || '',
      recommendations: audit.recommendations || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (audit) => {
    confirm({
      title: 'Remove Audit Schedule',
      message: `Are you sure you want to cancel and remove the audit: "${audit.title}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/audits/${audit._id}`, getAuthConfig());
          showNotification('Audit record removed', 'success');
          fetchData();
        } catch (err) {
          showNotification('Error deleting audit', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/audits/${currentAudit._id}`, formData, getAuthConfig());
        showNotification('Audit record updated', 'success');
      } else {
        await axios.post('http://localhost:5000/api/audits', formData, getAuthConfig());
        showNotification('New audit scheduled successfully', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving audit', 'error');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Scheduled': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = audits.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Administration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Audit Management</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Compliance & Quality Audits</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] hover:brightness-110 text-slate-950 rounded-2xl font-black transition-all shadow-xl shadow-[#2dd4bf]/30 active:scale-95 group uppercase text-xs tracking-widest"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span>Schedule New Audit</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Audit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-center gap-5 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                    <Calendar className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Audits</p>
                    <span className="text-2xl font-black text-slate-900">{audits.filter(a => a.status === 'Scheduled').length}</span>
                 </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-center gap-5 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                    <FileCheck className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Completed</p>
                    <span className="text-2xl font-black text-slate-900">{audits.filter(a => a.status === 'Completed').length}</span>
                 </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-center gap-5 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
                    <Clock className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Progress</p>
                    <span className="text-2xl font-black text-slate-900">{audits.filter(a => a.status === 'In Progress').length}</span>
                 </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search audits by title or auditor..."
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-1/4 px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Audit Scope & Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Unit / Dept</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Assigned Auditor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Scheduled Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="w-36 px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((audit) => (
                  <tr key={audit._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#2dd4bf]/10 group-hover:text-[#2dd4bf] transition-colors border border-slate-200/60 shadow-sm">
                           <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{audit.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{audit.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                             {audit.auditor?.employeeName?.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{audit.auditor?.employeeName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-[#2dd4bf]/60" />
                          <span className="text-xs font-bold">{new Date(audit.auditDate).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(audit.status)}`}>
                          {audit.status}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-right pr-10">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(audit)}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-[#2dd4bf] hover:border-[#2dd4bf] hover:text-slate-950 transition-all duration-300 shadow-sm active:scale-95"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(audit)}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={audits.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 my-8 flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b59662] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[#2dd4bf]/5 flex items-center justify-center border border-[#2dd4bf]/10 shadow-inner">
                      <FileCheck className="w-7 h-7 text-[#2dd4bf]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {isEditing ? 'Modify Audit Entry' : 'Schedule Audit Scope'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight uppercase tracking-widest opacity-60">Compliance & Regulatory Master</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto bg-white flex-1 max-h-[80vh]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Audit Title / Objective</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Q4 Internal Quality Audit - Nursing Department" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-bold text-slate-800 shadow-inner-sm" />
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Lead Auditor</label>
                    <Dropdown 
                      options={users}
                      value={formData.auditor}
                      onSelect={(val) => setFormData({...formData, auditor: val})}
                      fullWidth
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Scheduled Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input type="date" name="auditDate" value={formData.auditDate} onChange={handleInputChange} required className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
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

                  <div className="md:col-span-3 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                       <FileCheck className="w-4 h-4 text-[#2dd4bf]" />
                       Audit Checklist & Compliance Verification
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.checklist.map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
                          <div className="flex-1">
                             <p className="text-xs font-bold text-slate-800 mb-1">{item.item}</p>
                             <input 
                               type="text" 
                               value={item.observations} 
                               onChange={(e) => handleChecklistChange(idx, 'observations', e.target.value)}
                               placeholder="Add observations..." 
                               className="w-full text-[10px] text-slate-400 font-medium bg-transparent border-b border-slate-100 focus:border-[#b59662] outline-none py-1"
                             />
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                             {['Compliant', 'Non-Compliant', 'Not Applicable'].map(s => (
                               <button
                                 key={s}
                                 type="button"
                                 onClick={() => handleChecklistChange(idx, 'status', s)}
                                 className={`px-2 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                   item.status === s 
                                   ? (s === 'Compliant' ? 'bg-emerald-500 text-white' : s === 'Non-Compliant' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white')
                                   : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                 }`}
                               >
                                 {s}
                               </button>
                             ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Summary of Findings</label>
                    <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="2" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm" placeholder="Provide a high-level summary of the audit results..."></textarea>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Recommendations & Next Steps</label>
                    <textarea name="recommendations" value={formData.recommendations} onChange={handleInputChange} rows="2" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm" placeholder="Detail corrective actions or improvements..."></textarea>
                  </div>
                </div>

                <div className="flex gap-6 pt-8 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all border border-slate-200 uppercase tracking-[0.2em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-slate-950 text-[10px] font-black rounded-2xl shadow-2xl shadow-[#2dd4bf]/30 hover:brightness-110 transition-all active:scale-[0.98] uppercase tracking-[0.2em]">
                     {isEditing ? 'Confirm Audit Results' : 'Initialize Audit Schedule'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-slate-200 text-slate-400 relative overflow-hidden">
           <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-[#2dd4bf]/5 rounded-lg border border-[#2dd4bf]/10">
                <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />
              </div>
              <span className="text-[10px] font-black tracking-[0.1em] text-slate-500 uppercase">QCare Regulatory Compliance Engine</span>
           </div>
           <div className="flex items-center gap-4 relative z-10">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">System Integrity: Verified</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditManagement;
