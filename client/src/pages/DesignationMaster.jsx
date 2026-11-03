import useServerList from '../hooks/useServerList';
import ListToolbar from '../components/ListToolbar';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
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
  const list = useServerList('/api/designations');
  const { items: designations, loading } = list;
  const currentPage = list.page;
  const recordsPerPage = list.limit;
  const setCurrentPage = page => list.change({ page });

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDesignation, setCurrentDesignation] = useState(null);

  const { showNotification, confirm } = useNotification();

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

  const fetchDesignations = list.refresh;

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

  const handleDeleteClick = (id) => {
    confirm({ title: 'Delete designation?', message: 'Are you sure you want to delete this designation?', type: 'danger', confirmLabel: 'Delete designation', onConfirm: async () => {
      try {
        await axios.delete(`/api/designations/${id}`, getAuthConfig());
        fetchDesignations();
        showNotification('Designation deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting designation:', err);
        showNotification(err.response?.data?.message || 'Error deleting designation', 'danger');
      }
    } });
  };

  const toggleStatus = async (id) => {
    const desg = designations.find(d => d._id === id);
    if (!desg) return;
    const newStatus = desg.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/designations/${id}`, { status: newStatus }, getAuthConfig());
      fetchDesignations();
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
        await axios.put(`/api/designations/${currentDesignation._id}`, formData, getAuthConfig());
        fetchDesignations();
        showNotification('Designation updated successfully', 'success');
      } else {
        await axios.post('/api/designations', formData, getAuthConfig());
        fetchDesignations();
        showNotification('Designation created successfully', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving designation:', err);
      showNotification(err.response?.data?.message || 'Error saving designation', 'danger');
    }
  };

  const indexOfFirstRecord = (currentPage - 1) * recordsPerPage;
  const currentRecords = list.error || loading ? [] : designations;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Designation Master</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Designation Master</h1>
          </div>

          <button
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-primary hover:bg-primary text-white rounded-md font-semibold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Establish Designation</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <ListToolbar list={list} searchLabel="Search designations" sorts={[{ value: 'name', label: 'Title' }, { value: 'code', label: 'Code' }, { value: 'grade', label: 'Grade' }, { value: 'updatedAt', label: 'Updated' }]} />
          {list.error && <div role="alert" className="p-4 text-red-700">{list.error} <button type="button" onClick={list.refresh}>Retry</button></div>}
          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/50"><th scope="col" className="w-16 px-4 py-3">S/N</th>
                  <th className="w-1/4 px-7 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Designation Title</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Designation Code</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Grade Level</th>
                  <th className="w-1/3 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Job Description</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-[13px] font-semibold text-slate-500">
                      Loading designations...
                    </td>
                  </tr>
                ) : currentRecords.map((desg, index) => (
                  <tr key={desg._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-4 py-3">{indexOfFirstRecord + index + 1}</td>
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-800 font-semibold text-[12px]">
                          <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-800 leading-snug">{desg.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[13px] font-semibold text-[var(--color-primary)] font-mono">{desg.code}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-slate-700">{desg.grade}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-slate-600 line-clamp-1">{desg.description}</span>
                    </td>
                    <td className="px-6 py-4">
                       <button
                         onClick={() => toggleStatus(desg._id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold normal-case tracking-normal transition-colors ${
                           desg.status === 'Active'
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50'
                           : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
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
                {!loading && !list.error && currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-[13px] font-semibold normal-case tracking-normal">No designations registered</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <Pagination
            totalRecords={list.total}
            recordsPerPage={recordsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <Briefcase className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                        {isEditing ? 'Modify Designation Profile' : 'Establish Corporate Designation'}
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium tracking-tight">Setup staff role hierarchy and grades</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Designation Title</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Registered Nurse Specialised" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Designation Code</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g. RN-SPEC" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Grade Level</label>
                    <input name="grade" value={formData.grade} onChange={handleInputChange} required placeholder="e.g. Grade 7" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Status</label>
                    <Select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Job Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} placeholder="Describe the responsibilities and scope of this role..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800 resize-none" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 normal-case tracking-normal active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-primary text-white text-[13px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all active:scale-[0.98]">
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
