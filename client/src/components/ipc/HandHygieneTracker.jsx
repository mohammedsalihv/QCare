import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Droplets, Plus } from 'lucide-react';

const HandHygieneTracker = ({ trendData }) => {
  const chartData = trendData?.map(d => ({
    name: `${d._id.month}/${d._id.year}`,
    compliance: d.avgCompliance
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics and Goals */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col justify-between overflow-hidden relative group">
           <Droplets className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Hand Hygiene Goal</p>
              <h3 className="text-4xl font-black mt-2">85.0%</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">National Benchmark Target</p>
           </div>
           <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-xs">
                 <span className="font-black uppercase tracking-widest text-slate-400">Current Performance</span>
                 <span className="font-black text-blue-400">84.2%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-[84.2%]" />
              </div>
           </div>
           <button className="mt-8 w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              New Audit Entry
           </button>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Audit Compliance Trend</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip />
                  <ReferenceLine y={85} label={{ value: 'Target', position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HandHygieneTracker;
