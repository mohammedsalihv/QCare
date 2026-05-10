import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Award, UserCheck, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

const TrainingDashboard = ({ stats }) => {
  const complianceData = [
    { name: 'Compliant', value: parseFloat(stats?.complianceRate || 0), color: '#10b981' },
    { name: 'Non-Compliant', value: 100 - parseFloat(stats?.complianceRate || 0), color: '#f1f5f9' }
  ];

  const statCards = [
    { label: 'Overall Compliance', value: `${stats?.complianceRate || 0}%`, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Expiring Soon', value: stats?.expiringSoon || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Overdue', value: stats?.totalOverdue || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Staff Enrolled', value: stats?.totalStaff || 0, icon: Award, color: 'text-slate-600', bg: 'bg-slate-50' },
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Workforce Compliance</h3>
           <div className="relative w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    startAngle={180}
                    endAngle={0}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                 <span className="text-4xl font-black text-slate-900 dark:text-white">{stats?.complianceRate}%</span>
                 <span className="text-[10px] font-black text-emerald-500 uppercase">Certified</span>
              </div>
           </div>
        </div>

        {/* Action Required List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center justify-between">
              Critical Training Actions
              <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black rounded-full">URGENT</span>
           </h3>
           <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">Annual DOH Competency Refreshers</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Deadline: May 30, 2026</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 rounded-lg">Notify All</button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">New Hires: Mandatory Orientation</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">3 Staff Members Pending</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Manage</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
