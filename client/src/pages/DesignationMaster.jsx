import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { useNotification } from '../components/NotificationContext';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Briefcase,
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';

const DesignationMaster = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDesignation, setCurrentDesignation] = useState(null);

  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    grade: '',
    description: '',
    status: 'Active'
  });

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchDesignations = async () => {
    try {
      const { data } = await axios.get('http://192.168.1.160:5000/api/designations', getAuthConfig());
      setDesignations(data);
    } catch (err) {
      console.error('Error fetching designations:', err);
      showNotification(err.response?.data?.message || 'Error fetching designations', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      grade: '',
      description: '',
      status: 'Active'
    });
    setIsEditing(false);
    setCurrentDesignation(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (desg) => {
    setCurrentDesignation(desg);
    setFormData({
      title: desg.title,
      code: desg.code,
      grade: desg.grade,
      description: desg.description,
      status: desg.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await axios.delete(`http://192.168.1.160:5000/api/designations/${id}`, getAuthConfig());
        setDesignations(prev => prev.filter(d => d._id !== id));
        showNotification('Designation deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting designation:', err);
        showNotification(err.response?.data?.message || 'Error deleting designation', 'danger');
      }
    }
  };

  const toggleStatus = async (id) => {
    const desg = designations.find(d => d._id === id);
    if (!desg) return;
    const newStatus = desg.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const { data } = await axios.put(`http://192.168.1.160:5000/api/designations/${id}`, { status: newStatus }, getAuthConfig());
      setDesignations(prev => prev.map(d => d._id === id ? data : d));
      showNotification(`Designation status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification(err.response?.data?.message || 'Error updating status', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { data } = await axios.put(`http://192.168.1.160:5000/api/designations/${currentDesignation._id}`, formData, getAuthConfig());
        setDesignations(prev => prev.map(d => d._id === currentDesignation._id ? data : d));
        showNotification('Designation updated successfully', 'success');
      } else {
        const { data } = await axios.post('http://192.168.1.160:5000/api/designations', formData, getAuthConfig());
        setDesignations(prev => [data, ...prev]);
        showNotification('Designation created successfully', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving designation:', err);
      showNotification(err.response?.data?.message || 'Error saving designation', 'danger');
    }
  };

  const filteredDesignations = designations.filter(d => 
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.grade || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredDesignations.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-black font-bold uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Designation Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black font-bold tracking-tight">Designation Master</h1>
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Establish Designation</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black font-bold" />
               <input 
                 type="text" 
                 placeholder="Search designations by title, code, grade..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Designation Title</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Designation Code</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Grade Level</th>
                  <th className="w-1/3 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Job Description</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-xs font-semibold text-slate-500">
                      Loading designations...
                    </td>
                  </tr>
                ) : currentRecords.map((desg) => (
                  <tr key={desg._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-black font-bold text-[10px]">
                          <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 leading-snug">{desg.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-[var(--color-primary)] font-mono">{desg.code}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700">{desg.grade}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 line-clamp-1">{desg.description}</span>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleStatus(desg._id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                           desg.status === 'Active' 
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50' 
                           : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                         }`}
                       >
                          {desg.status === 'Active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(desg)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(desg._id)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {!loading && currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">No designations registered</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredDesignations.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-150 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <Briefcase className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black font-bold tracking-tight">
                        {isEditing ? 'Modify Designation Profile' : 'Establish Corporate Designation'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Setup staff role hierarchy and grades</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Designation Title</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Registered Nurse Specialised" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Designation Code</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g. RN-SPEC" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Grade Level</label>
                    <input name="grade" value={formData.grade} onChange={handleInputChange} required placeholder="e.g. Grade 7" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Status</label>
                    <Select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Job Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} placeholder="Describe the responsibilities and scope of this role..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800 resize-none" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Designation' : 'Publish Designation'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

          {/* Footer / branding removed */}
      </div>
    </DashboardLayout>
  );
};

export default DesignationMaster;
