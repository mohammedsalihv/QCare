import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Settings, Wrench, Calendar, AlertCircle, CheckCircle2, Siren } from 'lucide-react';

const FMSDashboard = ({ stats }) => {
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#64748b'];

  const statusData = stats?.statusDistribution?.map(s => ({
    name: s._id?.replace('-', ' '),
    value: s.count
  })) || [];

  const statCards = [
    { label: 'Total Assets', value: stats?.totalAssets || 0, icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Uptime Rate', value: `${stats?.uptimeRate || 0}%`, icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Calibration Due', value: stats?.calibrationDue || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Safety Drills', value: '100%', icon: Siren, color: 'text-blue-600', bg: 'bg-blue-50' },
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
        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Asset Status Overview</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-4">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{item.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Recent Drills */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Facility Safety Drills</h3>
           <div className="space-y-4">
              {stats?.recentDrills?.map((drill) => (
                <div key={drill._id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <Siren className={`w-5 h-5 ${drill.drillType.includes('Fire') ? 'text-rose-600' : 'text-blue-600'}`} />
                      <div>
                         <h4 className="text-xs font-bold text-slate-900 dark:text-white">{drill.drillType}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Response: {drill.responseTimeSeconds}s • Rating: {drill.overallRating}/5
                         </p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-emerald-50">Logged</span>
                </div>
              ))}
              {(!stats?.recentDrills || stats.recentDrills.length === 0) && (
                <div className="text-center py-20">
                   <CheckCircle2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No drills logged this quarter.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FMSDashboard;
