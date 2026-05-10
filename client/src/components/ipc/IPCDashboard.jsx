import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Droplets, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

const IPCDashboard = ({ stats }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const surveillanceData = stats?.ratesByInfection?.map(s => ({
    name: s._id,
    rate: s.avgRate
  })) || [];

  const statCards = [
    { label: 'Hand Hygiene Compliance', value: '84.2%', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Outbreaks', value: '1', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'PPE Compliance', value: '96%', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Isolation Cases', value: '4', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
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
        {/* HAI Rates Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Average HAI Rates (per 1,000 Patient Days)</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surveillanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Alerts & Benchmark List */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Infection Control Alerts</h3>
           <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">SSI Rate Threshold Exceeded</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Surgical Ward • April 2026</p>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-rose-600 bg-white px-3 py-1 rounded-full uppercase">Review</span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hand Hygiene Target Reached</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Medical Ward • 92% Compliance</p>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full uppercase">Optimal</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IPCDashboard;
