import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Search, 
  ChevronRight, 
  Users,
  FileEdit, 
  X, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';

const UserAssignment = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Sarah Wilson', email: 's.wilson@cmcholding.local', department: 'Emergency Medicine', role: 'DepartmentHead', designation: 'Chief of Emergency Services', status: 'Active' },
    { id: 2, name: 'Mohammed Salih', email: 'm.salih@cmcholding.local', department: 'Quality Assurance', role: 'SuperAdmin', designation: 'Quality Lead Systems Architect', status: 'Active' },
    { id: 3, name: 'Dr. Clara Thorne', email: 'c.thorne@cmcholding.local', department: 'Neurology', role: 'Staff', designation: 'Registrar in Neurology', status: 'Active' },
    { id: 4, name: 'Dr. Aaron Patel', email: 'a.patel@cmcholding.local', department: 'Pediatric Care', role: 'DepartmentHead', designation: 'Head of Pediatrics Unit', status: 'Inactive' },
    { id: 5, name: 'Yahiya Mannooparambil', email: 'yahiya.m@cmcholding.local', department: 'Information Technology', role: 'Staff', designation: 'Senior Clinical Support Specialist', status: 'Active' }
  ]);

  const [departments] = useState([
    'Emergency Medicine', 'Quality Assurance', 'Neurology', 'Pediatric Care', 'Information Technology', 'General Medicine', 'Pharmacy'
  ]);

  const [roles] = useState([
    { value: 'SuperAdmin', label: 'SuperAdmin' },
    { value: 'QualityManager', label: 'Quality Manager' },
    { value: 'DepartmentHead', label: 'Department Head' },
    { value: 'Staff', label: 'Staff' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    designation: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      designation: user.designation,
      status: user.status
    });
    setShowModal(true);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...formData } : u));
    setShowModal(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-black font-bold uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Security & Access</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">User Assignment Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black font-bold tracking-tight">User Assignment & Department Mapping</h1>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black font-bold" />
               <input 
                 type="text" 
                 placeholder="Search user assignments by name, role, department..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Employee Details</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Designation</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">System Role</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Department Unit</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-black font-bold text-[10px]">
                          <Users className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold text-slate-800 leading-snug">{user.name}</span>
                           <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                             <Mail className="w-2.5 h-2.5" />
                             {user.email}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-700">{user.designation}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          <Lock className="w-3 h-3 text-[var(--color-primary)]" />
                          <span>{user.role}</span>
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{user.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleStatus(user.id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                           user.status === 'Active' 
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50' 
                           : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                         }`}
                       >
                          {user.status === 'Active' ? (
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
                       <div className="flex items-center justify-end">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                            title="Edit Assignment"
                          >
                             <FileEdit className="w-4 h-4" />
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
                        <span className="text-xs font-bold uppercase tracking-widest">No user mappings cataloged</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={filteredUsers.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-150 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <UserCheck className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black font-bold tracking-tight">
                        Modify User Assignment
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Update organizational unit, role, and details for {formData.name}</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Staff Member Name</label>
                    <input name="name" value={formData.name} readOnly disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-150 rounded-xl outline-none text-xs font-semibold text-slate-500 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input name="email" value={formData.email} readOnly disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-150 rounded-xl outline-none text-xs font-semibold text-slate-500 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">System Access Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Hospital Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Employee Designation / Job Title</label>
                    <input name="designation" value={formData.designation} onChange={handleInputChange} required placeholder="e.g. Senior Nurse Auditor" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     Save Assignment Profile
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-black font-bold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-800 uppercase">QCare Corporate Identity Hub</span>
           </div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise User Mapping</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserAssignment;
