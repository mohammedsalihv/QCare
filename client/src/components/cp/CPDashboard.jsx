import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const CPDashboard = ({ stats }) => {
  const statCards = [
    { label: 'Clinicians Registered', value: stats?.totalStaff || 0, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approved Privileges', value: stats?.approvedPrivileges || 0, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approvals', value: stats?.pendingPrivileges || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Credential Expiries', value: stats?.criticalExpiries || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{card.value}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Gauge */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col justify-between overflow-hidden relative group">
           <ShieldCheck className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Privileging Compliance</p>
              <h3 className="text-4xl font-black mt-2">{stats?.complianceRate || 0}%</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Target: 100% Valid Privileges</p>
           </div>
           <div className="mt-8 space-y-4">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats?.complianceRate || 0}%` }} />
              </div>
           </div>
        </div>

        {/* Action Required */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Medical Affairs Alerts</h3>
           <div className="space-y-4">
              {stats?.criticalExpiries > 0 ? (
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <div>
                         <h4 className="text-sm font-bold text-slate-900 dark:text-white">Critical Certifications Expiring</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.criticalExpiries} Documents expire within 30 days</p>
                      </div>
                   </div>
                   <button className="text-[10px] font-black text-rose-600 bg-white px-4 py-2 rounded-xl uppercase shadow-sm">View All</button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Credentials Valid</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No immediate expiries detected in the next 30 days.</p>
                   </div>
                </div>
              )}

              {stats?.pendingPrivileges > 0 && (
                <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                         <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pending Privilege Requests</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.pendingPrivileges} Forms awaiting Medical Director sign-off</p>
                      </div>
                   </div>
                   <button className="text-[10px] font-black text-blue-600 bg-white px-4 py-2 rounded-xl uppercase shadow-sm">Review</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CPDashboard;
