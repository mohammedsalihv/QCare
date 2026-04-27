import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Server, 
  Lock, 
  Globe, 
  Save, 
  RefreshCcw,
  Network,
  Trash2,
  Edit,
  History,
  UserPlus,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  X,
  Eye,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const SystemSettings = () => {
  const initialRole = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
  const [role] = useState(initialRole);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialRole === 'superadmin' ? 'ldap' : 'global');
  const [ldapLogs, setLdapLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [ldapEditModes, setLdapEditModes] = useState({});
  const [settings, setSettings] = useState({
    ldapConfigs: [],
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    hospitalName: 'CMC Holding',
    primaryColor: '#2dd4bf',
    allowPublicRegistration: false
  });

  const [isLdapModalOpen, setIsLdapModalOpen] = useState(false);
  const [editingLdapIndex, setEditingLdapIndex] = useState(null);
  const [ldapModalTab, setLdapModalTab] = useState('configuration');
  const [testingConnection, setTestingConnection] = useState(false);

  const { showNotification } = useNotification();

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/settings', getAuthConfig());
      setSettings(data);
    } catch (err) {
      showNotification('Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLdapLogs = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/settings/ldap-logs', getAuthConfig());
      setLdapLogs(data);
    } catch (err) {
      console.error('Failed to load LDAP logs', err);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await axios.post('http://localhost:5000/api/settings/ldap-sync', {}, getAuthConfig());
      showNotification('LDAP Sync completed successfully', 'success');
      fetchLdapLogs();
    } catch (err) {
      showNotification(err.response?.data?.message || 'LDAP Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLdapLogs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLdapChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newConfigs = [...(settings.ldapConfigs || [])];
    newConfigs[index] = {
      ...newConfigs[index],
      [name]: type === 'checkbox' ? checked : value
    };
    setSettings({ ...settings, ldapConfigs: newConfigs });
  };

  const addLdapConfig = () => {
    const newConfigs = [...(settings.ldapConfigs || [])];
    newConfigs.push({
      configName: `AD Config ${newConfigs.length + 1}`,
      ldapEnabled: false,
      ldapUrl: '',
      ldapBaseDN: '',
      ldapBindDN: '',
      ldapBindPassword: '',
      ldapUserFilter: '(sAMAccountName={{username}})',
      ldapEmailField: 'mail',
      ldapNameField: 'displayName',
      syncBlockedUsers: false
    });
    setSettings({ ...settings, ldapConfigs: newConfigs });
  };

  const removeLdapConfig = (index) => {
    const newConfigs = settings.ldapConfigs.filter((_, i) => i !== index);
    setSettings({ ...settings, ldapConfigs: newConfigs });
  };

  const toggleLdapEdit = (index) => {
    setLdapEditModes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const saveLdapConfig = async (index) => {
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings', settings, getAuthConfig());
      showNotification('LDAP configuration saved successfully', 'success');
      toggleLdapEdit(index);
    } catch (err) {
      showNotification('Failed to save LDAP configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings', settings, getAuthConfig());
      showNotification('System settings updated successfully', 'success');
    } catch (err) {
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCcw className="w-8 h-8 text-[#2dd4bf] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const openLdapModal = (index = null) => {
    if (index !== null) {
      setEditingLdapIndex(index);
    } else {
      setEditingLdapIndex(null);
      const newConfigs = [...(settings.ldapConfigs || [])];
      newConfigs.push({
        configName: '',
        ldapEnabled: true,
        ldapUrl: 'ldap://',
        ldapBaseDN: '',
        ldapBindDN: '',
        ldapBindPassword: '',
        ldapUserFilter: '(sAMAccountName={{username}})',
        ldapEmailField: 'mail',
        ldapNameField: 'displayName',
        syncBlockedUsers: false,
        scheduleFrequency: 'Daily',
        scheduleEnabled: true,
        serverType: 'Microsoft AD'
      });
      setSettings({ ...settings, ldapConfigs: newConfigs });
      setEditingLdapIndex(newConfigs.length - 1);
    }
    setIsLdapModalOpen(true);
    setLdapModalTab('configuration');
  };

  const closeLdapModal = () => {
    setIsLdapModalOpen(false);
    setEditingLdapIndex(null);
  };

  const handleTestConnection = async () => {
    const config = settings.ldapConfigs[editingLdapIndex];
    if (!config.ldapUrl || !config.ldapBindDN || !config.ldapBindPassword) {
      showNotification('Please fill in URL, Bind DN, and Password first', 'warning');
      return;
    }

    setTestingConnection(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/settings/ldap-test', {
        ldapUrl: config.ldapUrl,
        ldapBindDN: config.ldapBindDN,
        ldapBindPassword: config.ldapBindPassword
      }, getAuthConfig());
      showNotification(data.message, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Connection failed', 'error');
    } finally {
      setTestingConnection(false);
    }
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ldap':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">LDAP Configurations</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage multiple authentication sources & synchronization schedules</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => openLdapModal()}
                      className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] hover:brightness-110 text-slate-950 rounded-2xl font-black transition-all shadow-xl shadow-[#2dd4bf]/30 active:scale-95 group uppercase text-xs tracking-widest"
                    >
                       <div className="flex items-center gap-3">
                          <Plus className="w-5 h-5" />
                          <span>Create LDAP Configuration</span>
                       </div>
                       <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <button 
                      onClick={handleTriggerSync}
                      disabled={syncing}
                      className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all shadow-xl shadow-slate-900/30 active:scale-95 group uppercase text-xs tracking-widest"
                    >
                       <div className="flex items-center gap-3">
                          <UserPlus className="w-5 h-5 text-[#2dd4bf]" />
                          <span>Import Users</span>
                       </div>
                       <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#2dd4bf]" />
                    </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-white border-b border-slate-50">
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Name</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">URL</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule Frequency</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Next Execution</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Schedule</th>
                       <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {(!settings.ldapConfigs || settings.ldapConfigs.length === 0) ? (
                       <tr>
                         <td colSpan="7" className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                               <Network size={48} />
                               <span className="text-[10px] font-black uppercase tracking-widest">No LDAP sources configured</span>
                            </div>
                         </td>
                       </tr>
                     ) : (
                       settings.ldapConfigs.map((config, index) => (
                         <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="py-6 px-8 whitespace-nowrap">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 <Server size={14} />
                               </div>
                               <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{config.configName}</span>
                             </div>
                           </td>
                           <td className="py-6 px-8">
                             <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 font-mono tracking-tight">
                               {config.ldapUrl || 'Not configured'}
                             </span>
                           </td>
                           <td className="py-6 px-8">
                              <span className="text-[11px] font-bold text-slate-600">{config.scheduleFrequency || 'Daily'}</span>
                           </td>
                           <td className="py-6 px-8">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800">
                                  {config.nextExecutionTime ? new Date(config.nextExecutionTime).toLocaleString() : 'Not scheduled'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                  Last: {config.lastExecutionDate ? new Date(config.lastExecutionDate).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                           </td>
                           <td className="py-6 px-8 text-center">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                config.executionStatus === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                config.executionStatus === 'Failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                config.executionStatus === 'Running' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                {config.executionStatus || 'Idle'}
                              </span>
                           </td>
                           <td className="py-6 px-8 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={config.scheduleEnabled} 
                                  onChange={(e) => handleLdapChange(index, { target: { name: 'scheduleEnabled', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                  className="sr-only peer" 
                                />
                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                           </td>
                           <td className="py-6 px-8 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button onClick={() => setActiveTab('logs')} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                    <History size={14} />
                                 </button>
                                 <button onClick={() => openLdapModal(index)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                    <Edit size={14} />
                                 </button>
                                 <button onClick={() => removeLdapConfig(index)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Pagination / Item Count Footnote */}
            <div className="flex items-center justify-between px-4 opacity-50">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Showing {settings.ldapConfigs?.length || 0} Sources</span>
               <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>10 items per page</span>
               </div>
            </div>

            {/* LDAP Configuration Modal */}
            {isLdapModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                          {editingLdapIndex !== null ? 'Edit LDAP Configuration' : 'Create LDAP Configuration'}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure active directory connectivity and mapping</p>
                     </div>
                     <button onClick={closeLdapModal} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all flex items-center justify-center">
                        <X size={20} />
                     </button>
                  </div>

                  {/* Modal Tabs */}
                  <div className="px-8 pt-6 flex items-center gap-8 border-b border-slate-100 bg-white">
                     <button 
                        onClick={() => setLdapModalTab('configuration')}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${ldapModalTab === 'configuration' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        Configuration
                        {ldapModalTab === 'configuration' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setLdapModalTab('mapping')}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${ldapModalTab === 'mapping' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        Mapping
                        {ldapModalTab === 'mapping' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
                     </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                     {ldapModalTab === 'configuration' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <Field 
                              label="Name *" 
                              name="configName" 
                              value={settings.ldapConfigs[editingLdapIndex]?.configName || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="e.g. Corporate AD"
                           />
                           <Field 
                              label="URL *" 
                              name="ldapUrl" 
                              value={settings.ldapConfigs[editingLdapIndex]?.ldapUrl || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="ldap://192.168.1.10"
                           />
                           <div className="md:col-span-2 py-4 border-y border-slate-50 bg-slate-50/50 -mx-8 px-8 my-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={12} className="text-blue-500" />
                                Configure multiple LDAP servers for failover and load balancing.
                              </p>
                              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                                 + Add URL
                              </button>
                           </div>
                           <Field 
                              label="Base DN *" 
                              name="ldapBaseDN" 
                              value={settings.ldapConfigs[editingLdapIndex]?.ldapBaseDN || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="OU=Users,DC=example,DC=com"
                           />
                           <Field 
                              label="User ID *" 
                              name="ldapUserFilter" 
                              value={settings.ldapConfigs[editingLdapIndex]?.ldapUserFilter || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="sAMAccountName={{username}}"
                           />
                           <Field 
                              label="Bind DN / Service Account *" 
                              name="ldapBindDN" 
                              value={settings.ldapConfigs[editingLdapIndex]?.ldapBindDN || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="salih@domain.local"
                           />
                           <Field 
                              label="Password *" 
                              name="ldapBindPassword" 
                              type="password"
                              value={settings.ldapConfigs[editingLdapIndex]?.ldapBindPassword || ''} 
                              onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                              placeholder="••••••••••••"
                           />
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Schedule Frequency</label>
                              <select 
                                 name="scheduleFrequency"
                                 value={settings.ldapConfigs[editingLdapIndex]?.scheduleFrequency || 'Daily'}
                                 onChange={(e) => handleLdapChange(editingLdapIndex, e)}
                                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold text-slate-800"
                              >
                                 <option value="Daily">Daily</option>
                                 <option value="Weekly">Weekly</option>
                                 <option value="Hourly">Hourly</option>
                                 <option value="Manual">Manual</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Server Type</label>
                              <select 
                                 name="serverType"
                                 value={settings.ldapConfigs[editingLdapIndex]?.serverType || 'Microsoft AD'}
                                 onChange={(e) => handleLdapChange(editingLdapIndex, e)}
                                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold text-slate-800"
                              >
                                 <option value="Microsoft AD">Microsoft AD</option>
                                 <option value="OpenLDAP">OpenLDAP</option>
                                 <option value="Generic">Generic / Other</option>
                              </select>
                           </div>
                           <div className="md:col-span-2 pt-4">
                              <Checkbox 
                                 label="Block missing users (if not blocked, missing users will be deleted)"
                                 name="syncBlockedUsers"
                                 checked={settings.ldapConfigs[editingLdapIndex]?.syncBlockedUsers || false}
                                 onChange={(e) => handleLdapChange(editingLdapIndex, e)}
                              />
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <Field 
                                 label="Full Name Attribute" 
                                 name="ldapNameField" 
                                 value={settings.ldapConfigs[editingLdapIndex]?.ldapNameField || 'displayName'} 
                                 onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                                 placeholder="displayName"
                              />
                              <Field 
                                 label="Email Attribute" 
                                 name="ldapEmailField" 
                                 value={settings.ldapConfigs[editingLdapIndex]?.ldapEmailField || 'mail'} 
                                 onChange={(e) => handleLdapChange(editingLdapIndex, e)} 
                                 placeholder="mail"
                              />
                           </div>
                           <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Layers size={14} className="text-blue-600" />
                                Advanced Attribute Mapping
                              </h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                                Map additional AD attributes to QCare user profiles (Department, Designation, Office, etc.)
                              </p>
                              <div className="space-y-4">
                                 {['department', 'title', 'physicalDeliveryOfficeName'].map((attr) => (
                                    <div key={attr} className="flex items-center gap-4">
                                       <div className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">{attr}</div>
                                       <ChevronRight size={16} className="text-slate-300" />
                                       <div className="flex-1 px-4 py-3 bg-white border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest">Profile {attr}</div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                     <button 
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                     >
                        {testingConnection ? <RefreshCcw size={16} className="animate-spin text-blue-600" /> : <Play size={16} className="text-emerald-500" />}
                        Test Connection
                     </button>
                     <div className="flex items-center gap-3">
                        <button onClick={closeLdapModal} className="px-8 py-3 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                        <button 
                          onClick={() => saveLdapConfig(editingLdapIndex)}
                          disabled={saving}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"
                        >
                           {saving && <RefreshCcw size={16} className="animate-spin" />}
                           Update
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'security':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Security Policies</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Access Control & Password Rules</p>
                  </div>
               </div>

               <div className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Password Requirements</h3>
                        <Field label="Minimum Length" name="minPasswordLength" type="number" value={settings.minPasswordLength} onChange={handleChange} />
                        <Checkbox label="Require Special Characters" name="requireSpecialChar" checked={settings.requireSpecialChar} onChange={handleChange} />
                        <Checkbox label="Require Numbers" name="requireNumbers" checked={settings.requireNumbers} onChange={handleChange} />
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Session Management</h3>
                        <Field label="Max Login Attempts" name="maxLoginAttempts" type="number" value={settings.maxLoginAttempts} onChange={handleChange} />
                        <Field label="Session Timeout (Minutes)" name="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={handleChange} />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'global':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                     <Globe className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Preferences</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Branding & System Behavior</p>
                  </div>
               </div>

               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Field label="Organization Name" name="hospitalName" value={settings.hospitalName} onChange={handleChange} />
                     <Field label="Primary Brand Color" name="primaryColor" type="color" value={settings.primaryColor} onChange={handleChange} />
                     <div className="md:col-span-2">
                        <Checkbox label="Allow Public User Registration" name="allowPublicRegistration" checked={settings.allowPublicRegistration} onChange={handleChange} />
                        <p className="text-[9px] text-slate-400 font-medium mt-1 ml-9">If enabled, users can create accounts from the login screen without admin intervention.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'logs':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Database className="w-5 h-5" />
                    </div>
                    <div>
                       <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Logs</h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">LDAP Synchronization History</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleTriggerSync}
                    disabled={syncing || !settings.ldapEnabled}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Trigger Manual Sync'}
                  </button>
               </div>

               <div className="p-0 overflow-hidden">
                  <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Total Fetched</th>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Success</th>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Failed</th>
                          <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ldapLogs.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-xs text-slate-400 font-medium">No sync logs found.</td>
                          </tr>
                        ) : (
                          ldapLogs.map((log) => (
                            <React.Fragment key={log._id}>
                              <tr className={`hover:bg-slate-50 transition-colors ${expandedLogId === log._id ? 'bg-slate-50' : ''}`}>
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="text-[11px] font-bold text-slate-700">{new Date(log.createdAt).toLocaleString()}</div>
                                  {log.syncedConfigs && log.syncedConfigs.length > 0 && (
                                    <div className="text-[9px] text-slate-400 mt-1 font-medium">{log.syncedConfigs.join(', ')}</div>
                                  )}
                                </td>
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'success' ? 'text-emerald-600' : log.status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>
                                      {log.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-6 text-xs font-bold text-slate-600">{log.totalFetched}</td>
                                <td className="py-3 px-6 text-xs font-bold text-emerald-600">{log.successCount}</td>
                                <td className="py-3 px-6 text-xs font-bold text-rose-600">{log.failedCount}</td>
                                <td className="py-3 px-6 text-right">
                                  <button 
                                    onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    {expandedLogId === log._id ? 'Hide Details' : 'View Details'}
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Expandable Details Row */}
                              {expandedLogId === log._id && (
                                <tr className="bg-slate-50/50">
                                  <td colSpan="6" className="p-6 border-t border-slate-100">
                                    <div className="space-y-6">
                                      {log.errorMessage && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                                          <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">System Error</h4>
                                          <p className="text-xs text-rose-700 font-medium whitespace-pre-wrap">{log.errorMessage}</p>
                                        </div>
                                      )}
                                      
                                      {(log.importedUsers.length > 0 || log.failedUsers.length > 0) && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {/* Imported Users Table */}
                                          {log.importedUsers.length > 0 && (
                                            <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden shadow-sm">
                                              <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Successfully Imported/Updated</h4>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{log.importedUsers.length} Users</span>
                                              </div>
                                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left">
                                                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                                                    <tr>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Employee ID</th>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Name</th>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Source AD</th>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400 text-right">Action</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-50">
                                                    {log.importedUsers.map((u, i) => (
                                                      <tr key={i} className="hover:bg-slate-50">
                                                        <td className="py-2 px-4 text-[10px] font-bold text-slate-600">{u.employeeId}</td>
                                                        <td className="py-2 px-4 text-[11px] font-medium text-slate-800">{u.employeeName}</td>
                                                        <td className="py-2 px-4 text-[10px] font-medium text-blue-600">{u.source || 'N/A'}</td>
                                                        <td className="py-2 px-4 text-[9px] font-bold text-emerald-600 text-right">{u.status}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Failed Users Table */}
                                          {log.failedUsers.length > 0 && (
                                            <div className="bg-white rounded-xl border border-rose-100 overflow-hidden shadow-sm">
                                              <div className="bg-rose-50 px-4 py-2 border-b border-rose-100 flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Failed to Import</h4>
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{log.failedUsers.length} Users</span>
                                              </div>
                                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left">
                                                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                                                    <tr>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Employee ID</th>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Source AD</th>
                                                      <th className="py-2 px-4 text-[9px] font-black uppercase text-slate-400">Failure Reason</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-50">
                                                    {log.failedUsers.map((u, i) => (
                                                      <tr key={i} className="hover:bg-rose-50/50">
                                                        <td className="py-2 px-4 text-[10px] font-bold text-rose-600">{u.employeeId}</td>
                                                        <td className="py-2 px-4 text-[10px] font-medium text-blue-600">{u.source || 'N/A'}</td>
                                                        <td className="py-2 px-4 text-[10px] font-medium text-slate-600">{u.reason}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-160px)] px-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">System Settings</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Global Application & Security Parameters</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2dd4bf] text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2dd4bf]/30 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Synchronizing...' : 'Save All Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-28">
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                {role === 'superadmin' && (
                  <SettingsTab icon={Network} label="LDAP / Auth" active={activeTab === 'ldap'} onClick={() => setActiveTab('ldap')} />
                )}
                <SettingsTab icon={ShieldCheck} label="Security Policies" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                <SettingsTab icon={Globe} label="Global / Branding" active={activeTab === 'global'} onClick={() => setActiveTab('global')} />
                {role === 'superadmin' && (
                  <SettingsTab icon={Database} label="System Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                )}
             </div>
             
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                   <Lock className="w-6 h-6 text-[#2dd4bf] mb-3" />
                   <h3 className="text-[11px] font-black uppercase tracking-widest mb-2">Admin Security</h3>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed opacity-80">
                     Changes to these parameters affect all users globally. Proceed with caution when modifying authentication or security policies.
                   </p>
                </div>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const SettingsTab = ({ icon: Icon, label, active, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
    active 
    ? 'bg-slate-900 text-white shadow-lg shadow-black/10' 
    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
  } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
    <Icon className={`w-4 h-4 ${active ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Field = ({ label, name, value, onChange, type = 'text', placeholder, disabled }) => (
  <div className={`space-y-1.5 ${disabled ? 'opacity-50' : ''}`}>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      name={name} 
      value={value} 
      onChange={onChange}
      placeholder={placeholder} 
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-bold text-slate-800 shadow-inner-sm disabled:cursor-not-allowed" 
    />
  </div>
);

const Checkbox = ({ label, name, checked, onChange, disabled }) => (
  <div className={`flex items-center gap-3 ${disabled ? 'opacity-50' : ''}`}>
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input 
        type="checkbox" 
        name={name} 
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer" 
      />
      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2dd4bf]"></div>
    </label>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
  </div>
);
export default SystemSettings;
