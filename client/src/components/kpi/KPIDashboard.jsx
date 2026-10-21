import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Target, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const KPIDashboard = ({ stats, trend, topBreached }) => {
  const statCards = [
    { title: 'Total KPIs', value: stats?.total || 0, icon: Target, color: 'text-[#040404]', bg: 'bg-slate-100' },
    { title: 'On Track', value: stats?.onTrack || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'At Risk', value: stats?.atRisk || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Breached', value: stats?.breached || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const chartData = trend?.map(t => ({
    name: `${t._id.period} ${t._id.year}`,
    Actual: parseFloat(t.avgValue.toFixed(2)),
    Target: parseFloat(t.avgTarget.toFixed(2))
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-slate-800 font-semibold">{card.title}</p>
              <h3 className="text-2xl font-semibold text-slate-800 ">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-800" />
              Performance Trend
            </h3>
            <div className="text-sm font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              Avg. Achievement: {stats?.avgAchievement}%
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="Actual" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Breached */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top Breached Indicators</h3>
          <div className="space-y-4">
            {topBreached && topBreached.length > 0 ? (
              topBreached.map((kpi, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-red-50/50 border border-red-100 ">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[13px] font-semibold text-red-600 normal-case">{kpi.indicatorCode}</span>
                    <span className="text-[13px] font-medium text-red-500">Variance: {kpi.variance}%</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 font-semibold line-clamp-1">{kpi.indicatorName}</p>
                  <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(Math.abs(kpi.calculatedValue), 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-800 font-semibold">No breached indicators</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
