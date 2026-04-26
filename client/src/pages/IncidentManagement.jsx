import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import Dropdown from '../components/Dropdown';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  User, 
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Eye,
  Settings2,
  Activity,
  Shield,
  Briefcase,
  Wrench,
  HelpCircle,
  Flag
} from 'lucide-react';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const { showNotification } = useNotification();
  
  // Options for Dropdowns
  const categoryOptions = [
    { label: 'Clinical', value: 'Clinical', icon: Activity },
    { label: 'Safety', value: 'Safety', icon: Shield },
    { label: 'Administrative', value: 'Administrative', icon: Briefcase },
    { label: 'Technical', value: 'Technical', icon: Wrench },
    { label: 'Other', value: 'Other', icon: HelpCircle },
  ];

  const severityOptions = [
    { label: 'Low', value: 'Low', icon: Flag },
    { label: 'Medium', value: 'Medium', icon: Flag },
    { label: 'High', value: 'High', icon: Flag },
    { label: 'Critical', value: 'Critical', icon: Flag },
  ];

  const statusOptions = [
    { label: 'Pending', value: 'Pending', icon: Clock },
    { label: 'Investigating', value: 'Investigating', icon: ShieldAlert },
    { label: 'Resolved', value: 'Resolved', icon: CheckCircle2 },
    { label: 'Closed', value: 'Closed', icon: X },
  ];

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Clinical',
    location: '',
    dateOfIncident: '',
    severity: 'Low'
  });

  // Admin Update State
  const [updateData, setUpdateData] = useState({
    status: '',
    severity: '',
    findings: '',
    actionsTaken: ''
  });

  const loggedInUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superadmin';

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/incidents', {
        headers: { Authorization: `Bearer ${loggedInUser.token}` }
      });
      setIncidents(data);
    } catch (error) {
      showNotification('Failed to fetch incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/incidents', formData, {
        headers: { Authorization: `Bearer ${loggedInUser.token}` }
      });
      showNotification('Incident reported successfully', 'success');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'Clinical',
        location: '',
        dateOfIncident: '',
        severity: 'Low'
      });
      fetchIncidents();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to report incident', 'error');
    }
  };

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:5000/api/incidents/${selectedIncident._id}`, updateData, {
        headers: { Authorization: `Bearer ${loggedInUser.token}` }
      });
      showNotification('Incident updated successfully', 'success');
      setShowViewModal(false);
      fetchIncidents();
    } catch (error) {
      showNotification('Failed to update incident', 'error');
    }
  };

  const openViewModal = (incident) => {
    setSelectedIncident(incident);
    setUpdateData({
      status: incident.status,
      severity: incident.severity,
      findings: incident.findings || '',
      actionsTaken: incident.actionsTaken || ''
    });
    setShowViewModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Investigating': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Closed': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'text-blue-500';
      case 'Medium': return 'text-amber-500';
      case 'High': return 'text-rose-500';
      case 'Critical': return 'text-red-700 font-black';
      default: return 'text-slate-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Quality Assurance</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Incident Reporting</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? 'Incident Management' : 'My Incident Reports'}
            </h1>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2dd4bf] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-[#2dd4bf]/30 active:scale-95 uppercase tracking-wide"
          >
             <Plus className="w-4 h-4" />
             <span>Report New Incident</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Reports" 
            value={incidents.length} 
            icon={FileText} 
            color="bg-slate-500" 
          />
          <StatCard 
            title="Pending Review" 
            value={incidents.filter(i => i.status === 'Pending').length} 
            icon={Clock} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Investigating" 
            value={incidents.filter(i => i.status === 'Investigating').length} 
            icon={ShieldAlert} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Resolved" 
            value={incidents.filter(i => i.status === 'Resolved').length} 
            icon={CheckCircle2} 
            color="bg-emerald-500" 
          />
        </div>

        {/* Incident Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, title or location..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#2dd4bf]/5 transition-all text-xs font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-400 transition-all">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-7 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[11%]">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[18%]">Incident Title</th>
                  {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[14%]">Reported By</th>}
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[10%]">Reported Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[10%]">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[10%]">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[9%]">Severity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[9%]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 w-[9%] text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="px-7 py-20 text-center text-slate-400">Loading incidents...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan="6" className="px-7 py-20 text-center text-slate-400">No incidents reported yet.</td></tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident._id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-7 py-4">
                        <span className="text-xs font-bold font-mono text-slate-600">{incident.incidentId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 leading-snug truncate">{incident.title}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                              {incident.reportedBy?.employeeName?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700 leading-none">{incident.reportedBy?.employeeName}</span>
                              <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{incident.reportedBy?.department}</span>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{new Date(incident.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(incident.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{incident.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                          {incident.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${incident.severity === 'Critical' ? 'bg-red-500' : incident.severity === 'High' ? 'bg-rose-500' : incident.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <span className={`text-[10px] font-black uppercase tracking-tight ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <button 
                          onClick={() => openViewModal(incident)}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-[#2dd4bf] hover:border-[#2dd4bf] hover:text-slate-950 transition-all duration-300"
                        >
                          {isAdmin ? <Settings2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2dd4bf] flex items-center justify-center text-slate-950 shadow-lg shadow-[#2dd4bf]/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Report Incident</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Safety & Quality Assurance</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 max-h-[80vh] overflow-y-auto">
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Incident Title / Summary</label>
                <input 
                  type="text" name="title" required value={formData.title} onChange={handleInputChange}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-bold text-slate-800 shadow-inner-sm"
                  placeholder="e.g., Medication Error at Ward 4"
                />
              </div>
              
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Category</label>
                <Dropdown 
                  options={categoryOptions}
                  value={formData.category}
                  onSelect={(val) => setFormData({ ...formData, category: val })}
                  fullWidth
                />
              </div>

              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Location / Unit</label>
                <input 
                  type="text" name="location" required value={formData.location} onChange={handleInputChange}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-bold text-slate-800 shadow-inner-sm"
                  placeholder="e.g., Emergency Room"
                />
              </div>

              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Date & Time of Incident</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2dd4bf] pointer-events-none z-10" />
                  <input 
                    type="datetime-local" 
                    name="dateOfIncident" 
                    required 
                    value={formData.dateOfIncident} 
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('.')[0].slice(0, 16)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-xs font-bold text-slate-800 appearance-none shadow-inner-sm"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Initial Severity</label>
                <Dropdown 
                  options={severityOptions}
                  value={formData.severity}
                  onSelect={(val) => setFormData({ ...formData, severity: val })}
                  fullWidth
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Detailed Description & Immediate Actions</label>
                <textarea 
                  name="description" required value={formData.description} onChange={handleInputChange} rows="4"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-bold text-slate-800 resize-none shadow-inner-sm"
                  placeholder="Provide a clear and detailed account of the incident..."
                ></textarea>
              </div>

              <div className="md:col-span-3 pt-6 border-t border-slate-100">
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-[#2dd4bf]/30 hover:brightness-110 active:scale-[0.98]">
                  Submit Official Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Update Modal */}
      {showViewModal && selectedIncident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${getStatusColor(selectedIncident.status).replace('bg-', 'bg-').split(' ')[0]}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{selectedIncident.incidentId}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Reported by {selectedIncident.reportedBy?.employeeName}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <InfoBlock label="Date & Time" value={new Date(selectedIncident.dateOfIncident).toLocaleString()} icon={Calendar} />
                <InfoBlock label="Location" value={selectedIncident.location} icon={MapPin} />
                <InfoBlock label="Category" value={selectedIncident.category} icon={Settings2} />
              </div>

              <div className="mb-8">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Incident Description</h4>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedIncident.description}
                </div>
              </div>

              {isAdmin ? (
                <form onSubmit={handleUpdateIncident} className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Admin Investigation & Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Update Status</label>
                      <Dropdown 
                        options={statusOptions}
                        value={updateData.status}
                        onSelect={(val) => setUpdateData({ ...updateData, status: val })}
                        fullWidth
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Adjust Severity</label>
                      <Dropdown 
                        options={severityOptions}
                        value={updateData.severity}
                        onSelect={(val) => setUpdateData({ ...updateData, severity: val })}
                        fullWidth
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Investigation Findings</label>
                    <textarea 
                      value={updateData.findings} onChange={e => setUpdateData({...updateData, findings: e.target.value})} rows="3"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] transition-all text-xs font-bold resize-none"
                      placeholder="Enter findings from the investigation..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Actions Taken</label>
                    <textarea 
                      value={updateData.actionsTaken} onChange={e => setUpdateData({...updateData, actionsTaken: e.target.value})} rows="3"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] transition-all text-xs font-bold resize-none"
                      placeholder="Detail actions taken to resolve the incident..."
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]">
                    Save Investigation & Update Status
                  </button>
                </form>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Resolution Details</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <ResolutionBlock label="Investigation Findings" value={selectedIncident.findings || 'Investigation in progress...'} />
                    <ResolutionBlock label="Actions Taken" value={selectedIncident.actionsTaken || 'Resolution pending...'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
      <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
    </div>
  </div>
);

const InfoBlock = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[11px] font-bold text-slate-700">{value}</span>
    </div>
  </div>
);

const ResolutionBlock = ({ label, value }) => (
  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
    <p className="text-xs font-bold text-slate-600 leading-relaxed">{value}</p>
  </div>
);

export default IncidentManagement;
