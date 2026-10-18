import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import { 
  ClipboardList, 
  Plus, 
  XCircle, 
  Loader2, 
  Calendar,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';

const CapaManagement = () => {
  const { showNotification } = useNotification();
  const [capas, setCapas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isManager = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [capasRes, usersRes] = await Promise.all([
        axios.get('/api/qms/capa', config),
        axios.get('/api/users', config)
      ]);
      
      setCapas(capasRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      showNotification('Failed to load CAPA data', 'error');
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
        source,
        description,
        rootCause,
        correctiveAction,
        preventiveAction,
        assignedTo: assignedTo || null,
        targetDate
      };
      await axios.post('/api/qms/capa', body, config);
      showNotification('CAPA Logged successfully!', 'success');
      setShowModal(false);

      // Reset form
      setSource('');
      setDescription('');
      setRootCause('');
      setCorrectiveAction('');
      setPreventiveAction('');
      setAssignedTo('');
      setTargetDate('');

      fetchData();
    } catch (error) {
      showNotification('Failed to submit CAPA', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/qms/capa/${id}`, { status }, config);
      showNotification(`CAPA set to ${status}`, 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  // Stats calculation
  const total = capas.length;
  const openCapas = capas.filter(c => c.status === 'Open').length;
  const underReview = capas.filter(c => c.status === 'Under Review').length;
  const closed = capas.filter(c => c.status === 'Closed').length;

  return (
    <DashboardLayout title="CAPA Management">
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-[#040404] text-white rounded-[2rem] shadow-xl">
                 <ClipboardList className="w-8 h-8 text-teal-400" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-black font-bold dark:text-white tracking-tight uppercase">CAPA Register</h2>
                 <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest mt-1">Corrective & Preventive Action • Root Cause Investigation • Effectiveness Verification</p>
              </div>
           </div>

           <button 
             onClick={() => setShowModal(true)}
             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
           >
             <Plus className="w-4 h-4" />
             Log New CAPA
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Total CAPAs</p>
              <h3 className="text-3xl font-black text-black font-bold mt-2">{total}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-black font-bold rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Active / Open</p>
              <h3 className="text-3xl font-black text-amber-600 mt-2">{openCapas}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><AlertCircle className="w-6 h-6 animate-pulse" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Verification Pending</p>
              <h3 className="text-3xl font-black text-[#040404] mt-2">{underReview}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-[#040404] rounded-2xl flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Verified & Closed</p>
              <h3 className="text-3xl font-black text-teal-600 mt-2">{closed}</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          </div>
        </div>

        {/* CAPA Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-black font-bold" />
          </div>
        ) : capas.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-black font-bold">
            No CAPA logs found. Click "Log New CAPA" to record corrective and preventive plans.
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.2em] px-2">CAPA Inventory</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {capas.map((capa) => (
                <div key={capa._id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Status Bar Top */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">{capa.capaId}</span>
                      <span className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Source: {capa.source}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {capa.targetDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-black font-bold uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                          <Calendar className="w-3.5 h-3.5" />
                          Target: {new Date(capa.targetDate).toLocaleDateString()}
                        </div>
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        capa.status === 'Closed' ? 'bg-teal-50 text-teal-600' :
                        capa.status === 'Verification' ? 'bg-indigo-50 text-indigo-600' :
                        capa.status === 'Under Review' ? 'bg-slate-100 text-[#040404]' : 'bg-amber-50 text-amber-600'
                      }`}>{capa.status}</span>
                    </div>
                  </div>

                  {/* CAPA Description and Root Cause */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.15em] mb-1">Issue Description</h4>
                        <p className="text-sm font-bold text-black font-bold leading-relaxed">{capa.description}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <h4 className="text-[9px] font-black text-black font-bold uppercase tracking-[0.15em] mb-1">Root Cause Analysis (RCA)</h4>
                        <p className="text-xs font-semibold text-black font-bold leading-relaxed">{capa.rootCause}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.15em] mb-3">Ownership</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#040404] text-white rounded-xl flex items-center justify-center font-black text-xs">
                            {capa.assignedTo?.employeeName?.substring(0, 2).toUpperCase() || 'Q'}
                          </div>
                          <div>
                            <span className="block text-[8px] font-black text-black font-bold uppercase">Assigned Actionee</span>
                            <span className="text-xs font-black text-black font-bold uppercase tracking-tight">{capa.assignedTo?.employeeName || 'Quality Team'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Corrective vs Preventive) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 p-6 rounded-[1.5rem] border border-slate-100">
                    <div className="space-y-2 border-r border-slate-100 pr-4">
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider block">Corrective Actions (Immediate Remediation)</span>
                      <p className="text-xs font-semibold text-black font-bold leading-relaxed">{capa.correctiveAction}</p>
                    </div>
                    <div className="space-y-2 pl-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Preventive Actions (Systemic Prevention)</span>
                      <p className="text-xs font-semibold text-black font-bold leading-relaxed">{capa.preventiveAction}</p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  {isManager && capa.status === 'Open' && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleStatusChange(capa._id, 'Under Review')}
                        className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Submit for Verification
                      </button>
                    </div>
                  )}

                  {isManager && capa.status === 'Under Review' && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleStatusChange(capa._id, 'Closed')}
                        className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Verify & Close CAPA
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Log CAPA Plan</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">Submit root cause details and action plans</p>
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
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Linked Source / Trigger</label>
                    <input 
                      type="text" 
                      required
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Deviation DEV-8821 or Audit finding"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Assign Actionee</label>
                      <Select 
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                      >
                        <option value="">Select Staff User</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.employeeName} ({u.department})</option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Target Closure Date</label>
                      <input 
                        type="date" 
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Incident / Finding Description</label>
                  <textarea 
                    rows="2"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide description of the deviation, audit breach, or failure..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Root Cause Analysis (RCA)</label>
                  <textarea 
                    rows="2"
                    required
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Describe Root Cause (e.g. Using the 5 Whys methodology)..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Corrective Actions (Immediate fix)</label>
                    <textarea 
                      rows="3"
                      required
                      value={correctiveAction}
                      onChange={(e) => setCorrectiveAction(e.target.value)}
                      placeholder="What corrective actions are taken immediately to resolve the current issue?"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Preventive Actions (Systemic prevention)</label>
                    <textarea 
                      rows="3"
                      required
                      value={preventiveAction}
                      onChange={(e) => setPreventiveAction(e.target.value)}
                      placeholder="What changes/controls are added to prevent recurrence of this issue?"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
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
                    Submit CAPA Plan
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

export default CapaManagement;
