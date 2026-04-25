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
  Network
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
    ldapEnabled: false,
    ldapUrl: '',
    ldapBaseDN: '',
    ldapBindDN: '',
    ldapBindPassword: '',
    ldapUserFilter: '(sAMAccountName={{username}})',
    ldapEmailField: 'mail',
    ldapNameField: 'displayName',
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    hospitalName: 'CMC Holding',
    primaryColor: '#b59662',
    allowPublicRegistration: false
  });

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
          <RefreshCcw className="w-8 h-8 text-[#b59662] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ldap':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {settings.ldapConfigs && settings.ldapConfigs.map((config, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                 <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <Server className="w-5 h-5" />
                       </div>
                       <div>
                          <input 
                            type="text" 
                            name="configName"
                            value={config.configName}
                            onChange={(e) => handleLdapChange(index, e)}
                            disabled={!ldapEditModes[index]}
                            className={`text-sm font-black text-slate-900 uppercase tracking-widest bg-transparent outline-none ${ldapEditModes[index] ? 'border-b border-dashed border-slate-300 focus:border-blue-500' : 'cursor-not-allowed'}`}
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Authentication Source</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {settings.ldapConfigs.length > 1 && (
                        <button 
                          onClick={() => removeLdapConfig(index)}
                          className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600 px-3 py-1 bg-rose-50 rounded-lg"
                        >
                          Remove
                        </button>
                      )}

                      {ldapEditModes[index] ? (
                        <button 
                          onClick={() => saveLdapConfig(index)}
                          disabled={saving}
                          className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {saving ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleLdapEdit(index)}
                          className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          Edit
                        </button>
                      )}

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="ldapEnabled" 
                          checked={config.ldapEnabled} 
                          onChange={(e) => handleLdapChange(index, e)}
                          disabled={!ldapEditModes[index]}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b59662]"></div>
                      </label>
                    </div>
                 </div>

                 <div className={`p-6 space-y-6 transition-all duration-500 ${!config.ldapEnabled ? 'opacity-40 grayscale' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Field label="Server URL" name="ldapUrl" value={config.ldapUrl || ''} onChange={(e) => handleLdapChange(index, e)} placeholder="ldap://your-server:389" disabled={!ldapEditModes[index]} />
                       <Field label="Base DN" name="ldapBaseDN" value={config.ldapBaseDN || ''} onChange={(e) => handleLdapChange(index, e)} placeholder="dc=example,dc=com" disabled={!ldapEditModes[index]} />
                       <Field label="Bind DN (Service Account)" name="ldapBindDN" value={config.ldapBindDN || ''} onChange={(e) => handleLdapChange(index, e)} placeholder="cn=admin,dc=example,dc=com" disabled={!ldapEditModes[index]} />
                       <Field label="Bind Password" name="ldapBindPassword" value={config.ldapBindPassword || ''} onChange={(e) => handleLdapChange(index, e)} type="password" placeholder="••••••••••••" disabled={!ldapEditModes[index]} />
                    </div>

                    <div className="pt-6 border-t border-slate-50 space-y-6">
                       <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Attribute Mapping & Filters</h3>
                         <Checkbox 
                           label="Sync Blocked AD Users" 
                           name="syncBlockedUsers" 
                           checked={config.syncBlockedUsers || false} 
                           onChange={(e) => handleLdapChange(index, e)} 
                           disabled={!ldapEditModes[index]}
                         />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Field label="User Filter" name="ldapUserFilter" value={config.ldapUserFilter || ''} onChange={(e) => handleLdapChange(index, e)} disabled={!ldapEditModes[index]} />
                          <Field label="Email Field" name="ldapEmailField" value={config.ldapEmailField || ''} onChange={(e) => handleLdapChange(index, e)} disabled={!ldapEditModes[index]} />
                          <Field label="Full Name Field" name="ldapNameField" value={config.ldapNameField || ''} onChange={(e) => handleLdapChange(index, e)} disabled={!ldapEditModes[index]} />
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            <button 
              onClick={addLdapConfig}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              + Add Another LDAP Configuration
            </button>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-[#b59662] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#b59662]/30 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
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
                   <Lock className="w-6 h-6 text-[#b59662] mb-3" />
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
    <Icon className={`w-4 h-4 ${active ? 'text-[#b59662]' : 'text-slate-400'}`} />
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
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] transition-all text-sm font-bold text-slate-800 shadow-inner-sm disabled:cursor-not-allowed" 
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
      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b59662]"></div>
    </label>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
  </div>
);
export default SystemSettings;
