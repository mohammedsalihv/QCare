import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MessageSquare, AlertCircle, Clock, ShieldAlert, TrendingUp } from 'lucide-react';

const ComplaintDashboard = ({ stats }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const categoryData = stats?.categories?.map(c => ({
    name: c._id || 'Other',
    value: c.count
  })) || [];

  const statCards = [
    { label: 'Active Complaints', value: stats?.open || 0, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Escalated Cases', value: stats?.escalated || 0, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Avg. Resolution', value: `${stats?.avgResTime || 0}d`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Satisfaction Rate', value: '88%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Complaints by Category</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{item.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Action List */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Critical Attention Required</h3>
           <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">DOH Portal Escalations</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">2 Cases pending legal review</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Review</button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pending Acknowledgments</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">5 Complaints {'>'} 48h old</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">View</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDashboard;
