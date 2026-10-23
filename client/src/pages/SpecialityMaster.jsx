import MasterSelect from '../components/MasterSelect';
import { useMasterData } from '../hooks/useMasterData';
import { saveMasterRecord, deleteMasterRecord } from '../utils/masterData';
import { useNotification } from '../components/NotificationContext';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Stethoscope,
  Building2, 
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Hash,
  User
} from 'lucide-react';

const SpecialityMaster = () => {
  const { data: masterRows, error: masterError } = useMasterData('specialties');
  const specialties = masterRows.map(row => ({ ...row, id: row._id, head: row.head?._id || '', headName: row.head?.employeeName || '' }));
  const { showNotification } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    head: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      head: '',
      status: 'Active'
    });
    setIsEditing(false);
    setCurrentSpecialty(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (spec) => {
    setCurrentSpecialty(spec);
    setFormData({
      name: spec.name,
      code: spec.code,
      department: spec.department,
      head: spec.head,
      status: spec.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    try { await deleteMasterRecord('specialties', id); } catch (error) { showNotification(error.response?.data?.message || 'Unable to archive record', 'error'); }
  };

  const toggleStatus = async (id) => {
    const row = specialties.find(item => item.id === id);
    try { await saveMasterRecord('specialties', { status: row.status === 'Active' ? 'Inactive' : 'Active' }, id); } catch (error) { showNotification(error.response?.data?.message || 'Unable to update status', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveMasterRecord('specialties', formData, isEditing ? currentSpecialty.id : undefined);
      setShowModal(false); resetForm();
    } catch (error) { showNotification(error.response?.data?.message || 'Unable to save record', 'error'); }
  };

  const filteredSpecialties = specialties.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.headName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredSpecialties.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      {masterError && <p role="alert" className="text-red-700">{masterError}</p>}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Speciality Master</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Speciality Master</h1>
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-primary hover:bg-primary text-white rounded-md font-semibold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Establish Specialty</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
               <input 
                 type="text" 
                 placeholder="Search specialties by name, code, lead..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-[13px] font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Specialty Name</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Specialty Code</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Department Unit</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Specialty Lead (Head)</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((spec) => (
                  <tr key={spec.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-800 font-semibold text-[12px]">
                          <Stethoscope className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-800 leading-snug">{spec.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[13px] font-semibold text-[var(--color-primary)] font-mono">{spec.code}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[13px] font-medium text-slate-700">{spec.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[13px] font-medium text-slate-700">{spec.headName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleStatus(spec.id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold normal-case tracking-normal transition-colors ${
                           spec.status === 'Active' 
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50' 
                           : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                         }`}
                       >
                          {spec.status === 'Active' ? (
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
                            onClick={() => handleEditClick(spec)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(spec.id)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-[13px] font-semibold normal-case tracking-normal">No clinical specialties registered</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredSpecialties.length} 
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
                      <Stethoscope className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                        {isEditing ? 'Modify Clinical Specialty' : 'Establish Clinical Specialty'}
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium tracking-tight">Configure medical expertise categories</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Specialty Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Nephrology" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Specialty Code</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g. NEPH" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Department Unit</label>
                    <MasterSelect resource="departments" valueKey="name" name="department" value={formData.department} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Specialty Lead (Head)</label>
                    <MasterSelect resource="users" name="head" value={formData.head} onChange={handleInputChange} required className="w-full p-3 border rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Status</label>
                    <Select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 normal-case tracking-normal active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-primary text-white text-[13px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Specialty' : 'Publish Specialty'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-800 font-semibold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold tracking-tight text-slate-800 normal-case">QCare Medical Specialty Registry</span>
           </div>
           <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Enterprise Clinical Master</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SpecialityMaster;
