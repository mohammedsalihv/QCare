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
  MessageSquare, 
  Heart,
  AlertOctagon,
  Lightbulb,
  FileEdit,
  Trash2,
  Filter,
  X,
  User,
  Building2,
  Phone,
  CheckCircle2,
  MoreVertical,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const PatientFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();

  const [formData, setFormData] = useState({
    patientName: '',
    contact: '',
    department: '',
    type: 'Compliment',
    content: '',
    status: 'Received',
    assignedTo: '',
    resolution: ''
  });

  const types = ['Compliment', 'Complaint', 'Suggestion'];
  const statuses = ['Received', 'Under Investigation', 'Action Taken', 'Resolved', 'Closed'];

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
      const [feedbacksRes, usersRes, deptsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/feedback', getAuthConfig()),
        axios.get('http://localhost:5000/api/users', getAuthConfig()),
        axios.get('http://localhost:5000/api/departments', getAuthConfig())
      ]);
      setFeedbacks(feedbacksRes.data);
      setUsers(usersRes.data.map(u => ({ label: u.employeeName, value: u._id })));
      setDepartments(deptsRes.data.map(d => ({ label: d.name, value: d.name })));
    } catch (err) {
      showNotification('Error fetching feedback data', 'error');
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
      patientName: '',
      contact: '',
      department: departments[0]?.value || '',
      type: 'Compliment',
      content: '',
      status: 'Received',
      assignedTo: '',
      resolution: ''
    });
    setIsEditing(false);
    setCurrentFeedback(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (feedback) => {
    setCurrentFeedback(feedback);
    setFormData({
      patientName: feedback.patientName,
      contact: feedback.contact || '',
      department: feedback.department,
      type: feedback.type,
      content: feedback.content,
      status: feedback.status,
      assignedTo: feedback.assignedTo?._id || '',
      resolution: feedback.resolution || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (feedback) => {
    confirm({
      title: 'Remove Feedback Entry',
      message: `Are you sure you want to permanently delete feedback from "${feedback.patientName}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/feedback/${feedback._id}`, getAuthConfig());
          showNotification('Feedback entry removed', 'success');
          fetchData();
        } catch (err) {
          showNotification('Error deleting feedback', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/feedback/${currentFeedback._id}`, formData, getAuthConfig());
        showNotification('Feedback status updated', 'success');
      } else {
        await axios.post('http://localhost:5000/api/feedback', formData, getAuthConfig());
        showNotification('New patient feedback recorded', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving feedback', 'error');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Compliment': return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Complaint': return <AlertOctagon className="w-5 h-5 text-amber-500" />;
      case 'Suggestion': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default: return <MessageSquare className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Action Taken':
      case 'Under Investigation': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = feedbacks.slice(indexOfFirstRecord, indexOfLastRecord);

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
              <span className="text-[#b59662]">Patient Feedback</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Experience & Feedback</h1>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] hover:brightness-110 text-slate-950 rounded-2xl font-black transition-all shadow-xl shadow-[#2dd4bf]/30 active:scale-95 group uppercase text-xs tracking-widest"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span>Log New Feedback</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Feedback Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'Total Feedback', value: feedbacks.length, icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
             { label: 'Compliments', value: feedbacks.filter(f => f.type === 'Compliment').length, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
             { label: 'Complaints', value: feedbacks.filter(f => f.type === 'Complaint').length, icon: AlertOctagon, color: 'text-amber-500', bg: 'bg-amber-50' },
             { label: 'Open Issues', value: feedbacks.filter(f => f.status !== 'Resolved' && f.status !== 'Closed').length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
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
            <div className="relative w-full lg:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search feedback by patient name or content..."
                 className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#b59662] transition-all text-xs font-semibold shadow-inner-sm"
               />
            </div>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-all active:scale-95">
                  <Filter className="w-3.5 h-3.5" />
                  Filter Results
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-1/4 px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Patient & Type</th>
                  <th className="w-1/3 px-6 py-5 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Feedback Content</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Department</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="w-36 px-6 py-5 text-[10px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((feedback) => (
                  <tr key={feedback._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center relative">
                           {getTypeIcon(feedback.type)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{feedback.patientName}</span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{feedback.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <p className="text-xs font-semibold text-slate-600 line-clamp-2 leading-relaxed">"{feedback.content}"</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{feedback.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-right pr-10">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(feedback)}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-[#b59662] hover:border-[#b59662] hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(feedback)}
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
            totalRecords={feedbacks.length} 
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
                      <MessageSquare className="w-7 h-7 text-[#b59662]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {isEditing ? 'Handle Feedback Record' : 'Log Patient Feedback'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight uppercase tracking-widest opacity-60">Patient Experience Management</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Patient Full Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input name="patientName" value={formData.patientName} onChange={handleInputChange} required placeholder="e.g. John Doe" className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 shadow-inner-sm" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Contact Details</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input name="contact" value={formData.contact} onChange={handleInputChange} placeholder="+971 50 XXXXXXX" className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 shadow-inner-sm" />
                    </div>
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

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Feedback Type</label>
                    <div className="flex gap-4">
                       {types.map(t => (
                         <button
                           key={t}
                           type="button"
                           onClick={() => setFormData({...formData, type: t})}
                           className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${
                             formData.type === t 
                             ? 'bg-slate-900 text-white border-transparent shadow-lg shadow-black/10' 
                             : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                           }`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Feedback Content</label>
                    <textarea name="content" value={formData.content} onChange={handleInputChange} rows="3" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm" placeholder="Detailed feedback from the patient..."></textarea>
                  </div>

                  {isEditing && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Handling Status</label>
                        <Dropdown 
                          options={statuses.map(s => ({ label: s, value: s }))}
                          value={formData.status}
                          onSelect={(val) => setFormData({...formData, status: val})}
                          fullWidth
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Assign to Professional</label>
                        <Dropdown 
                          options={users}
                          value={formData.assignedTo}
                          onSelect={(val) => setFormData({...formData, assignedTo: val})}
                          fullWidth
                        />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Resolution / Action Plan</label>
                        <textarea name="resolution" value={formData.resolution} onChange={handleInputChange} rows="2" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm" placeholder="Steps taken to resolve the issue or address suggestion..."></textarea>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-6 pt-8 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all border border-slate-200 uppercase tracking-[0.2em] active:scale-95">
                     Cancel
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-[#b59662] to-[#9e8254] text-white text-[10px] font-black rounded-2xl shadow-2xl shadow-[#b59662]/30 hover:shadow-3xl hover:from-[#a68959] hover:to-[#8f754b] transition-all active:scale-[0.98] uppercase tracking-[0.2em]">
                     {isEditing ? 'Confirm Updates' : 'Initialize Feedback Record'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-slate-200 text-slate-400">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-[#b59662]/5 rounded-lg border border-[#b59662]/10">
                <CheckCircle2 className="w-4 h-4 text-[#b59662]" />
              </div>
              <span className="text-[10px] font-black tracking-[0.1em] text-slate-500 uppercase">QCare Patient Experience Engine</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">System Security: Verified</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientFeedback;
