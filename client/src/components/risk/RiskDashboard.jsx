import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, TrendingDown } from 'lucide-react';

const RiskDashboard = ({ stats }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const categoryData = stats?.categories?.map(c => ({
    name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
    value: c.count
  })) || [];

  const statCards = [
    { label: 'Critical Risks', value: stats?.levels?.find(l => l._id === 'critical')?.count || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'High Risks', value: stats?.levels?.find(l => l._id === 'high')?.count || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Overdue Review', value: stats?.overdue || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Residual Score', value: stats?.avgResidual?.toFixed(1) || 0, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
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
        {/* Risk Distribution by Category */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Risk Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Critical Risks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center justify-between">
            Top Critical Risks
            <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black rounded-full uppercase">High Priority</span>
          </h3>
          <div className="space-y-4">
            {stats?.criticalRisks?.map((risk, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-rose-200 transition-all">
                <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-xs">
                      {risk.riskScore}
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">{risk.riskTitle}</h4>
                      <div className="flex gap-3 mt-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{risk.riskId}</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Owner: {risk.owner?.employeeName}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded">
                      Critical
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;
