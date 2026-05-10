import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Pill, AlertCircle, ShieldAlert, Activity, FileText } from 'lucide-react';

const MedicationSafetyDashboard = ({ stats }) => {
  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  const typeData = stats?.types?.map(t => ({
    name: t._id?.replace('-', ' '),
    count: t.count
  })) || [];

  const statCards = [
    { label: 'Total Med Errors', value: stats?.types?.reduce((a, b) => a + b.count, 0) || 0, icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Near Miss Cases', value: stats?.types?.find(t => t._id === 'near-miss')?.count || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Harmful Events', value: stats?.harmLevels?.filter(h => h._id !== 'none').reduce((a, b) => a + b.count, 0) || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Reviews', value: stats?.recent?.filter(r => r.status === 'open').length || 0, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
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
        {/* Error Types Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Errors by Classification</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Errors List */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Recent Safety Alerts</h3>
           <div className="space-y-4">
              {stats?.recent?.map((error) => (
                <div key={error._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${error.harmLevel === 'none' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                         <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                         <h4 className="text-xs font-bold text-slate-900 dark:text-white">{error.medicationName}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase">{error.errorType?.replace('-', ' ')} • {error.errorRef}</p>
                      </div>
                   </div>
                   <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${error.status === 'open' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {error.status}
                   </span>
                </div>
              ))}
              {(!stats?.recent || stats.recent.length === 0) && (
                <div className="text-center py-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent errors reported.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationSafetyDashboard;
