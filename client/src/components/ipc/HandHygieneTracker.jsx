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
        <div className="bg-primary text-white p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative group">
           <Droplets className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
           <div>
              <p className="text-[12px] font-semibold normal-case tracking-normal text-slate-800">Hand Hygiene Goal</p>
              <h3 className="text-4xl font-semibold mt-2">85.0%</h3>
              <p className="text-[12px] text-slate-800 font-semibold normal-case mt-1">National Benchmark Target</p>
           </div>
           <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-[13px]">
                 <span className="font-semibold normal-case tracking-normal text-slate-800">Current Performance</span>
                 <span className="font-semibold text-slate-800">84.2%</span>
              </div>
              <div className="w-full h-1 bg-primary rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-[84.2%]" />
              </div>
           </div>
           <button className="mt-8 w-full py-4 bg-primary rounded-2xl text-[12px] font-semibold normal-case tracking-normal hover:bg-primary transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              New Audit Entry
           </button>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal mb-8">Audit Compliance Trend</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip />
                  <ReferenceLine y={85} label={{ value: 'Target', position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="compliance" stroke="var(--color-secondary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--color-secondary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HandHygieneTracker;
