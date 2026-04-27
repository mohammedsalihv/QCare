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
  ShieldCheck,
  Building2,
  FileEdit,
  Trash2,
  Users,
  MapPin,
  X,
  Code2,
  User as UserIcon,
  ArrowUpRight
} from 'lucide-react';

const DepartmentMaster = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    head: '',
    location: ''
  });

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { role } = JSON.parse(userInfo);
      if (role !== 'admin' && role !== 'superadmin') {
        navigate('/dashboard');
      }
    } else {
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

  const fetchDepartments = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/departments', getAuthConfig());
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/users', getAuthConfig());
      // Map users to options for Dropdown
      const userOptions = data.map(u => ({
        label: u.employeeName,
        value: u.employeeName
      }));
      setUsers(userOptions);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      head: '',
      location: ''
    });
    setIsEditing(false);
    setCurrentDept(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (dept) => {
    setCurrentDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      head: dept.head,
      location: dept.location
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    confirm({
      title: 'Delete Department',
      message: 'Are you sure you want to remove this department from the system? This may affect personnel mapping.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/departments/${id}`, getAuthConfig());
          showNotification('Department removed successfully', 'success');
          fetchDepartments();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Error deleting department', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       if (isEditing) {
         await axios.put(`http://localhost:5000/api/departments/${currentDept._id}`, formData, getAuthConfig());
         showNotification('Department updated successfully', 'success');
       } else {
         await axios.post('http://localhost:5000/api/departments', formData, getAuthConfig());
         showNotification('New department established successfully', 'success');
       }
       setShowModal(false);
       fetchDepartments();
     } catch (err) {
       showNotification(err.response?.data?.message || 'Error saving department', 'error');
     }
   };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = departments.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Administration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Department Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Master</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] hover:brightness-110 text-slate-950 rounded-2xl font-black transition-all shadow-xl shadow-[#2dd4bf]/30 active:scale-95 group uppercase text-xs tracking-widest"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span>Add New Department</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search department by name or code..."
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-1/4 px-7 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Department Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Dept Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Head of Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Staff Count</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Location</th>
                  <th className="w-36 px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-snug">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold font-mono text-slate-600">{dept.code}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">{dept.head}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-bold text-slate-500">{dept.employeesCount} Members</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{dept.location}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(dept)}
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-300 active:scale-95"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(dept._id)}
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all duration-300 active:scale-95"
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
                        <span className="text-xs font-bold uppercase tracking-widest">No departments found matching your criteria</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={departments.length} 
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
                      <Building2 className="w-7 h-7 text-[#b59662]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'Modify Department' : 'Configure New Dept'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Establish structural units for CMC Holding</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department Name</label>
                    <div className="relative group">
                       <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                       <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Clinical Quality" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Dept Code</label>
                    <div className="relative group">
                       <Code2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                       <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="QUAL-OPS" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-black font-mono text-slate-800" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">In-Charge (Head)</label>
                    <Dropdown
                      options={users}
                      value={formData.head}
                      onSelect={(val) => setFormData({ ...formData, head: val })}
                      placeholder="Select Department Head"
                      fullWidth
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Location / Floor</label>
                    <div className="relative group">
                       <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                       <input name="location" value={formData.location} onChange={handleInputChange} required placeholder="Building A, 2nd Floor" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-xs font-bold text-slate-800" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-[#b59662] to-[#9e8254] text-white text-[10px] font-black rounded-xl shadow-xl shadow-[#b59662]/30 hover:shadow-2xl hover:from-[#a68959] hover:to-[#8f754b] transition-all active:scale-[0.98] uppercase tracking-[0.15em]">
                     {isEditing ? 'Update Structural Unit' : 'Establish Department'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-400">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b59662]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">QCare Master Database</span>
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest">Enterprise Structural Master</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentMaster;
