import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import Dropdown from '../components/Dropdown';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';
import { 
  Search, 
  FileEdit, 
  Trash2,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  BadgeCheck,
  X,
  Lock,
  User,
  Shield,
  Briefcase,
  Users,
  IdCard,
  AtSign,
  Crown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle2,
  Ban,
  UserX
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();

  // Logged-in user info
  const loggedInUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const loggedInId   = loggedInUser?._id;
  const loggedInRole = loggedInUser?.role;

  // Filter + sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('employeeName');
  const [sortDir, setSortDir] = useState('asc');
  const [openStatusMenu, setOpenStatusMenu] = useState(null); // user._id of open dropdown

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    designation: ''
  });

  const roleOptions = [
    { label: 'Super Admin', value: 'superadmin', icon: Crown },
    { label: 'System Admin', value: 'admin', icon: Users },
    { label: 'Quality Control', value: 'Quality', icon: Shield },
    { label: 'MRD Department', value: 'MRD', icon: Briefcase },
    { label: 'User', value: 'user', icon: User },
    { label: 'Medical Director', value: 'Director', icon: ShieldCheck },
  ];

  const statusFilterOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active', icon: CheckCircle2 },
    { label: 'Blocked', value: 'blocked', icon: Ban },
    { label: 'Inactive', value: 'inactive', icon: UserX },
  ];

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

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/users', getAuthConfig());
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/departments', getAuthConfig());
      setDepartments(data.map(d => ({ label: d.name, value: d.name })));
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (value) => {
    setFormData({ ...formData, role: value });
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      email: '',
      password: '',
      role: 'user',
      department: '',
      designation: ''
    });
    setIsEditing(false);
    setCurrentUser(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setFormData({
      employeeId: user.employeeId,
      employeeName: user.employeeName,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      password: ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (user) => {
    confirm({
      title: 'Remove Professional',
      message: `Are you sure you want to permanently delete "${user.employeeName}"? This cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/users/${user._id}`, getAuthConfig());
          showNotification('Professional profile removed successfully', 'success');
          fetchUsers();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Error deleting user', 'error');
        }
      }
    });
  };

  const handleSetStatus = async (user, newStatus) => {
    setOpenStatusMenu(null);
    if ((user.status || 'active') === newStatus) return;
    const labels = { active: 'activate', blocked: 'block', inactive: 'deactivate' };
    confirm({
      title: `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} User`,
      message: `Are you sure you want to ${labels[newStatus]} "${user.employeeName}"?`,
      type: newStatus === 'active' ? 'warning' : 'danger',
      onConfirm: async () => {
        try {
          const { data } = await axios.patch(
            `http://localhost:5000/api/users/${user._id}/toggle-status`,
            { status: newStatus },
            getAuthConfig()
          );
          showNotification(data.message, 'success');
          fetchUsers();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Error updating user status', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const required = ['employeeId', 'employeeName', 'email', 'department', 'designation'];
    if (!isEditing) required.push('password');
    
    const missing = required.filter(f => !formData[f]);
    if (missing.length > 0) {
      const fieldLabels = {
        employeeId: 'Employee ID',
        employeeName: 'Full Name',
        email: 'Email',
        department: 'Department',
        designation: 'Designation',
        password: 'Password'
      };
      const label = fieldLabels[missing[0]] || missing[0];
      showNotification(`${label} is required`, 'error');
      return;
    }

    try {
       if (isEditing) {
         await axios.put(`http://localhost:5000/api/users/${currentUser._id}`, formData, getAuthConfig());
         showNotification('Professional profile updated successfully', 'success');
       } else {
         await axios.post('http://localhost:5000/api/users', formData, getAuthConfig());
         showNotification('New professional onboarded successfully', 'success');
       }
       setShowModal(false);
       fetchUsers();
     } catch (err) {
       showNotification(err.response?.data?.message || 'Error saving user', 'error');
     }
   };

  // Derived: filter + sort
  const filteredSortedUsers = users
    .filter(u => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        u.employeeName?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q);
      const matchDept = !filterDept || u.department === filterDept;
      const userStatus = u.status || (u.isActive === false ? 'blocked' : 'active');
      const matchStatus = !filterStatus || userStatus === filterStatus;
      return matchQuery && matchDept && matchStatus;
    })
    .sort((a, b) => {
      let valA = (a[sortField] || '').toString().toLowerCase();
      let valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1 text-[#b59662]" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-[#b59662]" />;
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredSortedUsers.slice(indexOfFirstRecord, indexOfLastRecord);

  const statusOptions = [
    { value: 'active',   label: 'Active',   color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle2 },
    { value: 'blocked',  label: 'Blocked',  color: 'text-rose-500',    bg: 'bg-rose-50',    dot: 'bg-rose-400',    icon: Ban },
    { value: 'inactive', label: 'Inactive', color: 'text-slate-400',   bg: 'bg-slate-50',   dot: 'bg-slate-300',   icon: UserX },
  ];

  const getStatusMeta = (user) => {
    const s = user.status || (user.isActive === false ? 'blocked' : 'active');
    return statusOptions.find(o => o.value === s) || statusOptions[0];
  };

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
              <span className="text-[#b59662]">User Management</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#b59662] hover:bg-[#a68959] text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-[#b59662]/30 active:scale-95 uppercase tracking-wide"
          >
             <UserPlus className="w-4 h-4" />
             <span>Add New Professional</span>
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          {/* Filter Toolbar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/30">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search name, ID, email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-semibold"
                />
              </div>
              {/* Dept filter */}
              <div className="min-w-[180px]">
                <Dropdown 
                  options={[{ label: 'All Departments', value: '' }, ...departments]}
                  value={filterDept}
                  onSelect={(val) => { setFilterDept(val); setCurrentPage(1); }}
                  className="w-full"
                />
              </div>
              {/* Status filter */}
              <div className="min-w-[160px]">
                <Dropdown 
                  options={statusFilterOptions}
                  value={filterStatus}
                  onSelect={(val) => { setFilterStatus(val); setCurrentPage(1); }}
                  className="w-full"
                />
              </div>
              {/* Clear filters */}
              {(searchQuery || filterDept || filterStatus) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterDept(''); setFilterStatus(''); setCurrentPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 text-xs font-black hover:bg-rose-100 transition-all"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
              <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredSortedUsers.length} of {users.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th
                    className="w-1/4 px-7 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 cursor-pointer select-none hover:text-[#b59662] transition-colors"
                    onClick={() => handleSort('employeeName')}
                  >
                    Full Name <SortIcon field="employeeName" />
                  </th>
                  <th
                    className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 cursor-pointer select-none hover:text-[#b59662] transition-colors"
                    onClick={() => handleSort('employeeId')}
                  >
                    Employee ID <SortIcon field="employeeId" />
                  </th>
                  <th
                    className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 cursor-pointer select-none hover:text-[#b59662] transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    Role <SortIcon field="role" />
                  </th>
                  <th
                    className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 cursor-pointer select-none hover:text-[#b59662] transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    Department <SortIcon field="department" />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    Status
                  </th>
                  <th className="w-36 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((user) => {
                  const sm = getStatusMeta(user);
                  const isOwnRow = user._id === loggedInId;
                  // Only superadmin can change own status; admins cannot change own or another superadmin's status
                  const canChangeStatus = !isOwnRow || loggedInRole === 'superadmin';
                  return (
                  <tr key={user._id} className={`hover:bg-slate-50/20 transition-colors group ${sm.value !== 'active' ? 'opacity-70' : ''}`}>
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] ${sm.value === 'active' ? 'bg-slate-100 text-slate-400' : `${sm.bg} ${sm.color}`}`}>
                          {user.employeeName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 leading-snug">{user.employeeName}</span>
                            {isOwnRow && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#b59662]/10 text-[#b59662] border border-[#b59662]/20">You</span>
                            )}
                            {user.authSource && user.authSource !== 'local' && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100" title="Synchronized from Active Directory">
                                {user.authSource}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{user.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold font-mono text-slate-600">{user.employeeId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        user.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        user.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight">{user.department}</span>
                    </td>
                    {/* Clickable Status Badge with Dropdown */}
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        {canChangeStatus ? (
                          <>
                            <button
                              onClick={() => setOpenStatusMenu(openStatusMenu === user._id ? null : user._id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all hover:shadow-sm ${sm.bg} ${sm.color} border-current/10`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`}></span>
                              {sm.label}
                              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                            {openStatusMenu === user._id && (
                              <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
                                {statusOptions.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleSetStatus(user, opt.value)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-slate-50 ${
                                      sm.value === opt.value ? `${opt.color} ${opt.bg}` : 'text-slate-500'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`}></span>
                                    {opt.label}
                                    {sm.value === opt.value && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span
                            title="You cannot change your own account status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-not-allowed opacity-80 ${sm.bg} ${sm.color} border-current/10`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`}></span>
                            {sm.label}
                            <Lock className="w-2.5 h-2.5 opacity-50" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            title="Edit"
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-300 active:scale-95"
                          >
                             <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => !isOwnRow && handleDeleteClick(user)}
                            title={isOwnRow ? 'Cannot delete your own account' : 'Delete Permanently'}
                            disabled={isOwnRow}
                            className={`w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center transition-all duration-300 ${
                              isOwnRow
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:bg-rose-500 hover:border-rose-500 hover:text-white active:scale-95'
                            }`}
                          >
                             <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                  );
                })}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">No users found matching your criteria</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={filteredSortedUsers.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b59662] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[#b59662]/5 flex items-center justify-center border border-[#b59662]/10 shadow-inner">
                      <UserPlus className="w-7 h-7 text-[#b59662]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'Modify User Profile' : 'Onboard New Profile'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Configure professional credentials and access level</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-20 space-y-10 bg-white">
                <div className="space-y-10">
                  {/* Identity Group */}
                  <div>
                     <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-5">
                        <User className="w-3 h-3" />
                        Identity Credentials
                     </h4>
                     <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5 focus-within:text-[#b59662] transition-colors">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Full Name <span className="text-rose-500">*</span></label>
                           <div className="relative group">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                              <input name="employeeName" value={formData.employeeName} onChange={handleInputChange} required placeholder="Dr. Jameel Ahmed" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-bold text-slate-800 shadow-inner-sm" />
                           </div>
                        </div>
                        <div className="space-y-1.5 focus-within:text-[#b59662] transition-colors">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Employee ID <span className="text-rose-500">*</span></label>
                           <div className="relative group">
                              <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                              <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} required placeholder="EMP2024XX" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-black font-mono text-slate-800 shadow-inner-sm disabled:opacity-50" disabled={isEditing} />
                           </div>
                        </div>
                        <div className="space-y-1.5 focus-within:text-[#b59662] transition-colors">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Designation <span className="text-rose-500">*</span></label>
                           <div className="relative group">
                              <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                              <input name="designation" value={formData.designation} onChange={handleInputChange} required placeholder="Chief Physician" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-bold text-slate-800 shadow-inner-sm" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Access & Placement Group */}
                  <div className="grid grid-cols-2 gap-x-10">
                     <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
                           <Lock className="w-3 h-3" />
                           Security
                        </h4>
                        <div className="space-y-4">
                           <div className="space-y-1.5 focus-within:text-[#b59662] transition-colors">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email <span className="text-rose-500">*</span></label>
                              <div className="relative group">
                                 <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                                 <input name="email" value={formData.email} onChange={handleInputChange} required type="email" placeholder="email@cmcholding.local" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-bold text-slate-800 shadow-inner-sm" />
                              </div>
                           </div>
                           <div className="space-y-1.5 focus-within:text-[#b59662] transition-colors">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Password {!isEditing && <span className="text-rose-500">*</span>}</label>
                              <div className="relative group">
                                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#b59662] transition-colors" />
                                 <input name="password" value={formData.password} onChange={handleInputChange} required={!isEditing} type="password" placeholder={isEditing ? '••••••••' : '••••••••'} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/5 transition-all text-xs font-bold text-slate-800 shadow-inner-sm" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
                           <Shield className="w-3 h-3" />
                           Placement
                        </h4>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department <span className="text-rose-500">*</span></label>
                               <Dropdown
                                  options={departments}
                                  value={formData.department}
                                  onSelect={(val) => setFormData(prev => ({ ...prev, department: val }))}
                                  placeholder="Select Department"
                                  fullWidth
                               />
                            </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">System Privilege</label>
                              <Dropdown 
                                 options={roleOptions} 
                                 value={formData.role} 
                                 onSelect={handleRoleSelect} 
                                 fullWidth
                              />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Cancel
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-[#b59662] to-[#9e8254] text-white text-[10px] font-black rounded-xl shadow-xl shadow-[#b59662]/30 hover:shadow-2xl hover:from-[#a68959] hover:to-[#8f754b] transition-all active:scale-[0.98] uppercase tracking-[0.15em]">
                     {isEditing ? 'Confirm Changes' : 'Initialize User'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-center py-6 border-t border-slate-200 text-slate-400">
           <ShieldCheck className="w-4 h-4 text-[#b59662]/50" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
