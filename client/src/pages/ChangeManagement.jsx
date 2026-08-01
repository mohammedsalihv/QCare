import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import { 
  Settings, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar, 
  AlertCircle,
  TrendingUp,
  User,
  Users
} from 'lucide-react';

const ChangeManagement = () => {
  const { showNotification } = useNotification();
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [clinicalImpact, setClinicalImpact] = useState('');
  const [operationalImpact, setOperationalImpact] = useState('');
  const [financialImpact, setFinancialImpact] = useState('');
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isApprover = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/qms/change-requests', config);
      setChangeRequests(res.data);
    } catch (error) {
      showNotification('Failed to load change requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = {
        title,
        description,
        reason,
        department,
        priority,
        impactAssessment: {
          clinical: clinicalImpact,
          operational: operationalImpact,
          financial: financialImpact
        }
      };
      await axios.post('/api/qms/change-requests', body, config);
      showNotification('Change Request submitted successfully!', 'success');
      setShowModal(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setReason('');
      setDepartment('');
      setPriority('Medium');
      setClinicalImpact('');
      setOperationalImpact('');
      setFinancialImpact('');
      
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Submission failed', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/qms/change-requests/${id}`, { status }, config);
      showNotification(`Change Request set to ${status}`, 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  // Stats calculation
  const total = changeRequests.length;
  const pending = changeRequests.filter(r => r.status === 'Pending Approval').length;
  const approved = changeRequests.filter(r => r.status === 'Approved').length;
  const implemented = changeRequests.filter(r => r.status === 'Implemented').length;

  return (
    <DashboardLayout title="Change Management & MOC">
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-[#040404] text-white rounded-[2rem] shadow-xl">
                 <Settings className="w-8 h-8 animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-black font-bold dark:text-white tracking-tight uppercase">Management of Change (MOC)</h2>
                 <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest mt-1">Impact Assessment • Clinical Approvals • Audit Readiness</p>
              </div>
           </div>

           <button 
             onClick={() => setShowModal(true)}
             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
           >
             <Plus className="w-4 h-4" />
             Initiate MOC Request
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Total MOC Logs</p>
              <h3 className="text-3xl font-black text-black font-bold mt-2">{total}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-black font-bold rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Pending Review</p>
              <h3 className="text-3xl font-black text-amber-600 mt-2">{pending}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Approved & Active</p>
              <h3 className="text-3xl font-black text-teal-600 mt-2">{approved}</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Implemented</p>
              <h3 className="text-3xl font-black text-indigo-600 mt-2">{implemented}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Change Request List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-black font-bold" />
          </div>
        ) : changeRequests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-black font-bold">
            No change requests logged yet. Click "Initiate MOC Request" to log one.
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.2em] px-2">Change Request Registry</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {changeRequests.map((req) => (
                <div key={req._id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Top Header */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">{req.changeId}</span>
                        <span className={`ml-2 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                          req.priority === 'Critical' ? 'bg-rose-50 text-rose-600' :
                          req.priority === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-black font-bold'
                        }`}>{req.priority} Priority</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        req.status === 'Implemented' ? 'bg-indigo-50 text-indigo-600' :
                        req.status === 'Approved' ? 'bg-teal-50 text-teal-600' :
                        req.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>{req.status}</span>
                    </div>

                    <h4 className="text-lg font-black text-black font-bold uppercase tracking-tight mb-2">{req.title}</h4>
                    <p className="text-black font-bold text-xs font-medium mb-4 leading-relaxed">{req.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-4 text-[10px] font-black uppercase tracking-wider text-black font-bold">
                      <div>
                        <span className="block text-black font-bold text-[8px]">Department</span>
                        <span className="text-black font-bold">{req.department}</span>
                      </div>
                      <div>
                        <span className="block text-black font-bold text-[8px]">Requested By</span>
                        <span className="text-black font-bold">{req.requestedBy?.employeeName || 'System'}</span>
                      </div>
                    </div>

                    {/* Impact Assessment Expandable Block */}
                    <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                      <span className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Impact Assessment</span>
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-bold text-black font-bold">
                        <div className="bg-slate-50/50 p-2.5 rounded-lg">
                          <span className="text-[8px] font-black text-black font-bold block uppercase mb-1">Clinical</span>
                          {req.impactAssessment?.clinical || 'N/A'}
                        </div>
                        <div className="bg-slate-50/50 p-2.5 rounded-lg">
                          <span className="text-[8px] font-black text-black font-bold block uppercase mb-1">Operational</span>
                          {req.impactAssessment?.operational || 'N/A'}
                        </div>
                        <div className="bg-slate-50/50 p-2.5 rounded-lg">
                          <span className="text-[8px] font-black text-black font-bold block uppercase mb-1">Financial</span>
                          {req.impactAssessment?.financial || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  {isApprover && req.status === 'Pending Approval' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleStatusChange(req._id, 'Approved')}
                        className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Approve Request
                      </button>
                      <button 
                        onClick={() => handleStatusChange(req._id, 'Rejected')}
                        className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {req.status === 'Approved' && isApprover && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleStatusChange(req._id, 'Implemented')}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Mark as Fully Implemented
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initiate Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Initiate Change Request (MOC)</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">Provide detailed risk and impact evaluations</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-black font-bold hover:text-black font-bold rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Change Request Title</label>
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Upgrade Vaccine Storage Fridge"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Department</label>
                      <input 
                        type="text" 
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Pharmacy"
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Priority</label>
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Detailed Scope & Description</label>
                  <textarea 
                    rows="3"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe exactly what changes are being proposed..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Reason for Change / Justification</label>
                  <textarea 
                    rows="2"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this change necessary? Mention risk mitigation benefits."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                {/* Impact Assessment */}
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <span className="text-[10px] font-black text-black font-bold uppercase tracking-widest block border-b border-slate-200 pb-2">Risk & Impact Assessment</span>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Clinical Impact / Patient Safety</label>
                      <input 
                        type="text"
                        required
                        value={clinicalImpact}
                        onChange={(e) => setClinicalImpact(e.target.value)}
                        placeholder="e.g. Reduces dosing verification delay by 15%."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 text-xs font-medium"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Operational Impact / Staff training</label>
                      <input 
                        type="text"
                        required
                        value={operationalImpact}
                        onChange={(e) => setOperationalImpact(e.target.value)}
                        placeholder="e.g. Requires a 30-min briefing for night shift nurses."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Financial Impact / Budget</label>
                      <input 
                        type="text"
                        required
                        value={financialImpact}
                        onChange={(e) => setFinancialImpact(e.target.value)}
                        placeholder="e.g. Covered fully under standard facility support agreement."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-black font-bold rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ChangeManagement;
