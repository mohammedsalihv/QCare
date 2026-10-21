import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import { 
  AlertTriangle, 
  Plus, 
  XCircle, 
  Loader2, 
  Calendar,
  AlertCircle,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Link2,
  User
} from 'lucide-react';

const DeviationsNCs = () => {
  const { showNotification } = useNotification();
  const [deviations, setDeviations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Clinical');
  const [severity, setSeverity] = useState('Minor');
  const [immediateAction, setImmediateAction] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isManager = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/qms/deviations', config);
      setDeviations(res.data);
    } catch (error) {
      showNotification('Failed to load deviations', 'error');
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
      const body = { title, description, category, severity, immediateAction };
      await axios.post('/api/qms/deviations', body, config);
      showNotification('Deviation logged successfully!', 'success');
      setShowModal(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Clinical');
      setSeverity('Minor');
      setImmediateAction('');
      
      fetchData();
    } catch (error) {
      showNotification('Failed to log deviation', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/qms/deviations/${id}`, { status }, config);
      showNotification(`Deviation status updated to ${status}`, 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  // Stats calculation
  const total = deviations.length;
  const logged = deviations.filter(d => d.status === 'Logged').length;
  const investigating = deviations.filter(d => d.status === 'Under Investigation').length;
  const closed = deviations.filter(d => d.status === 'Closed').length;

  return (
    <DashboardLayout title="Deviations & Non-Conformances">
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-primary text-white rounded-2xl shadow-xl">
                 <AlertTriangle className="w-8 h-8 animate-pulse text-amber-500" />
              </div>
              <div>
                 <h2 className="text-2xl font-semibold text-slate-800 tracking-tight normal-case">Deviations & NC Register</h2>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Non-Conformance Auditing • Immediate Actions • Corrective Workflows</p>
              </div>
           </div>

           <button 
             onClick={() => setShowModal(true)}
             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-lg"
           >
             <Plus className="w-4 h-4" />
             Log Deviation / NC
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Total Logged</p>
              <h3 className="text-3xl font-semibold text-slate-800 mt-2">{total}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-slate-800 font-semibold rounded-2xl flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">New / Logged</p>
              <h3 className="text-3xl font-semibold text-slate-800 mt-2">{logged}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Investigating</p>
              <h3 className="text-3xl font-semibold text-amber-600 mt-2">{investigating}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Resolved & Closed</p>
              <h3 className="text-3xl font-semibold text-teal-600 mt-2">{closed}</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Deviation Registry List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800 font-semibold" />
          </div>
        ) : deviations.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-800 font-semibold">
            No deviations or NCs logged. Select "Log Deviation / NC" to add a new record.
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal px-2">Deviation & NC Inventory</h3>
            
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Ref ID</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Details</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Category</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Severity</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Logged By</th>
                      <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deviations.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-6">
                          <span className="text-[13px] font-semibold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg">{item.deviationId}</span>
                        </td>
                        <td className="p-6 max-w-sm">
                          <p className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight mb-1">{item.title}</p>
                          <p className="text-[12px] text-slate-800 font-semibold line-clamp-2">{item.description}</p>
                          {item.immediateAction && (
                            <div className="mt-2 text-[12px] font-semibold text-teal-600 bg-teal-50/50 p-2 rounded-lg">
                              <span className="font-semibold text-[12px] normal-case tracking-normal block text-teal-500">Immediate Action Taken:</span>
                              {item.immediateAction}
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{item.category}</span>
                        </td>
                        <td className="p-6">
                          <span className={`text-[12px] font-semibold normal-case tracking-normal px-3 py-1 rounded-full ${
                            item.severity === 'Critical' ? 'bg-rose-50 text-rose-600' :
                            item.severity === 'Major' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-800 font-semibold'
                          }`}>{item.severity}</span>
                        </td>
                        <td className="p-6">
                          <span className={`text-[12px] font-semibold normal-case tracking-normal px-3 py-1 rounded-full ${
                            item.status === 'Closed' ? 'bg-teal-50 text-teal-600' :
                            item.status === 'CAPA Linked' ? 'bg-indigo-50 text-indigo-600' :
                            item.status === 'Under Investigation' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-800 font-semibold'
                          }`}>{item.status}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-800 font-semibold" />
                            <span className="text-[13px] font-semibold text-slate-800">{item.identifiedBy?.employeeName || 'System'}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === 'Logged' && isManager && (
                              <button 
                                onClick={() => handleStatusChange(item._id, 'Under Investigation')}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-[12px] font-semibold normal-case tracking-normal transition-all hover:bg-primary"
                              >
                                Investigate
                              </button>
                            )}
                            {item.status === 'Under Investigation' && isManager && (
                              <>
                                <button 
                                  onClick={() => handleStatusChange(item._id, 'CAPA Linked')}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[12px] font-semibold normal-case tracking-normal transition-all hover:bg-indigo-700 flex items-center gap-1"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  Link CAPA
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(item._id, 'Closed')}
                                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[12px] font-semibold normal-case tracking-normal transition-all hover:bg-teal-700"
                                >
                                  Close
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Log Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 md:p-10 max-w-xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">Log Deviation / NC</h3>
                  <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Record process variations or non-conforming items</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold hover:text-slate-800 rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal block">Title / Brief Event Name</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Temperature excursion in Fridge #3"
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[13px] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal block">Category</label>
                    <Select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[13px] font-semibold bg-white"
                    >
                      <option value="Clinical">Clinical</option>
                      <option value="Operational">Operational</option>
                      <option value="Facility">Facility</option>
                      <option value="Safety">Safety</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal block">Severity</label>
                    <Select 
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[13px] font-semibold bg-white"
                    >
                      <option value="Minor">Minor (No clinical impact)</option>
                      <option value="Major">Major (Potential risk)</option>
                      <option value="Critical">Critical (Immediate event/exposure)</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal block">Event Description</label>
                  <textarea 
                    rows="3"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on what deviated, who was involved, and dates..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[13px] font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal block">Immediate Action Taken</label>
                  <textarea 
                    rows="2"
                    required
                    value={immediateAction}
                    onChange={(e) => setImmediateAction(e.target.value)}
                    placeholder="Describe immediate containment actions..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-[13px] font-semibold"
                  />
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-[12px] normal-case tracking-normal transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-primary hover:bg-primary text-white rounded-xl text-[12px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Log Event
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

export default DeviationsNCs;
