import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ClipboardCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const AuditDashboard = ({ stats }) => {
  const pillarData = stats?.pillarStats?.map(p => ({
    pillar: p._id.replace('-', ' '),
    score: parseFloat(p.avgScore.toFixed(2)),
    fullMark: 100
  })) || [];

  const statCards = [
    { label: 'Completed Audits', value: stats?.counts?.find(c => c._id === 'completed')?.count || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'In Progress', value: stats?.counts?.find(c => c._id === 'in-progress')?.count || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Scheduled', value: stats?.counts?.find(c => c._id === 'scheduled')?.count || 0, icon: ClipboardCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Overdue', value: stats?.overdue?.length || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart for Governance Pillars */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Governance Pillar Performance</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Compliance %"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue List */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center justify-between">
            Critical Overdue Audits
            <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black rounded-full">ACTION REQUIRED</span>
          </h3>
          <div className="space-y-4">
            {stats?.overdue?.map((audit, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{audit.auditTitle}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{audit.department}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-rose-600 uppercase">
                    Scheduled: {new Date(audit.scheduledDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.overdue || stats.overdue.length === 0) && (
               <div className="text-center py-20 opacity-30">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No Overdue Audits</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
