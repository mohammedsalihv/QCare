import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { UserCheck } from 'lucide-react';

const CPDashboard = ({ stats }) => {
  const statCards = [
    { label: 'Clinicians Registered', value: stats?.totalStaff || 0, icon: UserCheck, color: 'text-[#040404]', bg: 'bg-slate-100' },
    { label: 'Approved Privileges', value: stats?.approvedPrivileges || 0, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approvals', value: stats?.pendingPrivileges || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Credential Expiries', value: stats?.criticalExpiries || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="text-2xl font-semibold text-slate-800 ">{card.value}</span>
            </div>
            <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Gauge */}
        <div className="bg-primary text-white p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative group">
           <ShieldCheck className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
           <div>
              <p className="text-[12px] font-semibold normal-case tracking-normal text-emerald-400">Privileging Compliance</p>
              <h3 className="text-4xl font-semibold mt-2">{stats?.complianceRate || 0}%</h3>
              <p className="text-[12px] text-slate-800 font-semibold normal-case mt-1">Target: 100% Valid Privileges</p>
           </div>
           <div className="mt-8 space-y-4">
              <div className="w-full h-2 bg-primary rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats?.complianceRate || 0}%` }} />
              </div>
           </div>
        </div>

        {/* Action Required */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal mb-8">Medical Affairs Alerts</h3>
           <div className="space-y-4">
              {stats?.criticalExpiries > 0 ? (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <div>
                         <h4 className="text-sm font-semibold text-slate-800 ">Critical Certifications Expiring</h4>
                         <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{stats.criticalExpiries} Documents expire within 30 days</p>
                      </div>
                   </div>
                   <button className="text-[12px] font-semibold text-rose-600 bg-white px-4 py-2 rounded-xl normal-case shadow-sm">View All</button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   <div>
                      <h4 className="text-sm font-semibold text-slate-800 ">All Credentials Valid</h4>
                      <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">No immediate expiries detected in the next 30 days.</p>
                   </div>
                </div>
              )}

              {stats?.pendingPrivileges > 0 && (
                <div className="p-5 rounded-2xl bg-slate-100 border border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-slate-800" />
                      <div>
                         <h4 className="text-sm font-semibold text-slate-800 ">Pending Privilege Requests</h4>
                         <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{stats.pendingPrivileges} Forms awaiting Medical Director sign-off</p>
                      </div>
                   </div>
                   <button className="text-[12px] font-semibold text-slate-800 bg-white px-4 py-2 rounded-xl normal-case shadow-sm">Review</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CPDashboard;
