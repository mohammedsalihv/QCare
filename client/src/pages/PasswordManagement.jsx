import Table from '../components/Table.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Search, 
  ChevronRight, 
  KeyRound, 
  X, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Users,
  Settings,
  RefreshCcw,
  Eye,
  EyeOff
} from 'lucide-react';

const PasswordManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Sarah Wilson', username: 's.wilson', email: 's.wilson@cmcholding.local', authSource: 'LDAP', forceReset: false, lastChanged: '2026-03-12' },
    { id: 2, name: 'Mohammed Salih', username: 'm.salih', email: 'm.salih@cmcholding.local', authSource: 'Local', forceReset: false, lastChanged: '2026-05-20' },
    { id: 3, name: 'Dr. Clara Thorne', username: 'c.thorne', email: 'c.thorne@cmcholding.local', authSource: 'LDAP', forceReset: true, lastChanged: '2026-01-10' },
    { id: 4, name: 'Dr. Aaron Patel', username: 'a.patel', email: 'a.patel@cmcholding.local', authSource: 'Local', forceReset: false, lastChanged: '2026-02-15' },
    { id: 5, name: 'Yahiya Mannooparambil', username: 'yahiyam', email: 'yahiya.m@cmcholding.local', authSource: 'Local', forceReset: false, lastChanged: '2026-06-06' }
  ]);

  const [policy, setPolicy] = useState({
    minLength: 12,
    requireNumbers: true,
    requireSpecial: true,
    requireUppercase: true,
    expiryDays: 90
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleForceReset = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, forceReset: !u.forceReset } : u));
  };

  const handleResetClick = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPassword(false);
    setShowResetModal(true);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    alert(`Password for user ${selectedUser.name} has been manually updated. The user will be notified.`);
    setShowResetModal(false);
  };

  const handlePolicyChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : parseInt(e.target.value);
    setPolicy({ ...policy, [e.target.name]: value });
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    alert('Security and password validation policies saved successfully!');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Security & Access</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Password Management</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Credentials & Password Security</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Force Reset Dashboard */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
                <div>
                   <h4 className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Active User Accounts</h4>
                   <p className="text-[12px] text-slate-500 font-medium tracking-tight mt-1">Manage corporate login and active resets</p>
                </div>
                <div className="relative w-full sm:w-[250px]">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
                   <input 
                     type="text" 
                     placeholder="Search employees..."
                     value={searchQuery}
                     onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                     className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-[13px] font-semibold"
                   />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-100/50">
                      <th className="w-1/3 px-7 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Employee Details</th>
                      <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Auth Bind</th>
                      <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Last Changed</th>
                      <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Force Reset</th>
                      <th className="w-36 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecords.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/20 transition-colors group">
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-800 font-semibold text-[12px]">
                              <Users className="w-4 h-4 text-[var(--color-primary)]" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[13px] font-semibold text-slate-800 leading-snug">{user.name}</span>
                               <span className="text-[12px] text-slate-500 font-medium">@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex px-2 py-1 rounded-lg border text-[12px] font-semibold normal-case tracking-normal ${
                             user.authSource === 'LDAP' 
                             ? 'bg-blue-50/50 border-blue-200 text-blue-600' 
                             : 'bg-amber-50/50 border-amber-200 text-[var(--color-primary)]'
                           }`}>
                              {user.authSource}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-slate-600 font-mono font-semibold">{user.lastChanged}</td>
                        <td className="px-6 py-4">
                           <button 
                             onClick={() => handleToggleForceReset(user.id)}
                             disabled={user.authSource === 'LDAP'}
                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold normal-case tracking-normal transition-colors ${
                               user.authSource === 'LDAP'
                               ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-250 text-slate-500'
                               : user.forceReset
                               ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
                               : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                             }`}
                           >
                              {user.forceReset ? (
                                <>
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                  <span>Disabled</span>
                                </>
                              )}
                           </button>
                        </td>
                        <td className="px-6 py-4 text-right pr-8">
                           {user.authSource === 'Local' ? (
                             <button 
                               onClick={() => handleResetClick(user)}
                               className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center gap-1.5 text-[12px] font-semibold normal-case tracking-normal hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                             >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                             </button>
                           ) : (
                             <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal" title="LDAP password managed by Active Directory">Managed by AD</span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <Pagination 
                totalRecords={filteredUsers.length} 
                recordsPerPage={recordsPerPage} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage} 
              />
            </div>
          </div>

          {/* Right Panel: Password Policies */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-[var(--color-primary)]" />
                   </div>
                   <h4 className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Password Policy Rules</h4>
                </div>

                <form onSubmit={handleSavePolicy} className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Min Password Length</label>
                      <input type="number" name="minLength" min={8} max={30} value={policy.minLength} onChange={handlePolicyChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800" />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Expiry Calendar (Days)</label>
                      <input type="number" name="expiryDays" min={0} max={365} value={policy.expiryDays} onChange={handlePolicyChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800" />
                   </div>

                   <div className="space-y-4 pt-2 border-t border-slate-100">
                      {[
                        { name: 'requireNumbers', label: 'Require Numeric Digits (0-9)' },
                        { name: 'requireSpecial', label: 'Require Special Characters (@, #, etc.)' },
                        { name: 'requireUppercase', label: 'Require Uppercase Letter' }
                      ].map((chk) => (
                        <label key={chk.name} className="flex items-center gap-3 cursor-pointer select-none">
                           <input 
                             type="checkbox" 
                             name={chk.name}
                             checked={policy[chk.name]} 
                             onChange={handlePolicyChange}
                             className="w-4 h-4 border-slate-300 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" 
                           />
                           <span className="text-[13px] font-medium text-slate-700">{chk.label}</span>
                        </label>
                      ))}
                   </div>

                   <button type="submit" className="w-full py-3 bg-primary hover:bg-primary text-white rounded-md text-[13px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-sm">
                      Apply Policies
                   </button>
                </form>
             </div>
          </div>
        </div>

        {/* Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowResetModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <KeyRound className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Manual Reset</h3>
                      <p className="text-[13px] text-slate-500 font-medium tracking-tight">Input new password for {selectedUser?.name}</p>
                   </div>
                </div>
                <button onClick={() => setShowResetModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="space-y-2 relative group">
                  <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">New System Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                      placeholder="Input security validated password..." 
                      className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 active:scale-95"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 normal-case tracking-normal active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-primary text-white text-[13px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all active:scale-[0.98]">
                     Update Password
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-800 font-semibold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold tracking-tight text-slate-800 normal-case">QCare Cryptographic Security Layer</span>
           </div>
           <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Enterprise Password Policy</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PasswordManagement;
