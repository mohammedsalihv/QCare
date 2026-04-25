import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import Dropdown from '../components/Dropdown';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  FileEdit,
  Trash2,
  ChevronRight,
  Printer,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  History,
  ExternalLink,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const StatCard = ({ title, count, icon: Icon, color, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}></div>
    <div className="flex flex-col gap-4 relative z-10">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl ${color.replace('text-', 'bg-').split(' ')[0]}/10 ${color.split(' ')[0]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{count}</h3>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // Get user info
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role || 'user';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const adminStats = [
    { title: 'System-wide Pending', count: 124, icon: Clock, color: 'text-rose-500', trend: '+12%', trendUp: false },
    { title: 'Total Resolved', count: 892, icon: CheckCircle2, color: 'text-emerald-500', trend: '+24%', trendUp: true },
    { title: 'Active Depts', count: 18, icon: Layers, color: 'text-violet-500', trend: 'Stable', trendUp: true },
    { title: 'New (This Month)', count: 45, icon: AlertCircle, color: 'text-blue-500', trend: '+8%', trendUp: true },
  ];

  const userStats = [
    { title: 'My Reported Cases', count: 8, icon: History, color: 'text-blue-500', trend: 'Active', trendUp: true },
    { title: 'Awaiting Action', count: 2, icon: Clock, color: 'text-rose-500', trend: 'High Priority', trendUp: false },
    { title: 'Resolved for Me', count: 15, icon: CheckCircle2, color: 'text-emerald-500', trend: '100% Success', trendUp: true },
    { title: 'Dept. Ranking', count: '#4', icon: TrendingUp, color: 'text-violet-500', trend: 'Top 10%', trendUp: true },
  ];

  const pieData = [
    { name: 'Pending', value: 35, color: '#f43f5e' },
    { name: 'Completed', value: 55, color: '#10b981' },
    { name: 'Rejected', value: 10, color: '#8b5cf6' },
  ];

  const areaData = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 18 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 32 },
    { name: 'Sat', value: 10 },
    { name: 'Sun', value: 8 },
  ];

  const mockIncidents = [
    { id: 1, date: '18/04/2026', reported: '18/04/2026', number: 'INC-2026-0012', details: 'Patient Centered Care Policy Update', type: 'Policy Review', dept: 'Quality Assurance', approver: 'Dr. Sarah Wilson', status: 'Pending' },
    { id: 2, date: '17/04/2026', reported: '17/04/2026', number: 'INC-2026-0011', details: 'IT Security Protocol Breach Attempt', type: 'Security', dept: 'Information Technology', approver: 'System Admin', status: 'Completed' },
    { id: 3, date: '15/04/2026', reported: '16/04/2026', number: 'INC-2026-0010', details: 'Medication Storage Humidity Alert', type: 'Environment', dept: 'Pharmacy', approver: 'Mohammed Salih', status: 'Rejected' },
  ];

  const filteredData = mockIncidents.filter(i => i.status === activeTab || activeTab === 'All');
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);

  const filterOptions = [
    { label: 'Sort by Date', icon: Calendar },
    { label: 'Sort by Department', icon: Layers },
    { label: 'Highest Priority', icon: AlertCircle },
  ];

  const exportOptions = [
    { label: 'Download PDF', icon: Printer },
    { label: 'Export Excel', icon: FileSpreadsheet },
    { label: 'Export JSON', icon: FileJson },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#b59662]/20 to-transparent"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#b59662]/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-[#b59662]/20 text-[#b59662] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#b59662]/30">
                   {userRole} Portal
                 </span>
                 <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                   <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Welcome back,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b59662] to-[#e5c58a]">
                    {userInfo.employeeName || 'Healthcare Professional'}
                  </span>
                </h1>
                <p className="text-slate-400 mt-4 text-sm font-medium max-w-xl">
                  {isAdmin 
                    ? "Your administrative command center is ready. Review system-wide performance and incident trends below."
                    : "Review your recent incident reports, department status, and access the document library for latest updates."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <button className="flex items-center justify-between gap-4 px-6 py-4 bg-[#b59662] hover:bg-[#a68959] text-white rounded-2xl font-black transition-all shadow-xl shadow-[#b59662]/30 active:scale-95 group uppercase text-xs tracking-widest">
                 <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5" />
                    <span>Report Incident</span>
                 </div>
                 <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button className="flex items-center justify-between gap-4 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black transition-all border border-white/10 active:scale-95 uppercase text-xs tracking-widest group">
                 <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-slate-400" />
                    <span>Resource Library</span>
                 </div>
                 <ExternalLink className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(isAdmin ? adminStats : userStats).map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Analytics Section (Only for Admins) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Status Distribution</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global metrics</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                     <Activity className="w-5 h-5" />
                  </div>
               </div>
               <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                     <span className="text-2xl font-black text-slate-900">100%</span>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Active</p>
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-8">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-[#b59662]/20">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                       <span className="text-[8px] font-black text-slate-500 uppercase">{item.name}</span>
                       <span className="text-xs font-black text-slate-900">{item.value}%</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                  <div>
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Incident Reporting Trend</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Past 7 days performance</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <ArrowUpRight className="w-3 h-3" /> Growth 18%
                     </span>
                  </div>
               </div>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b59662" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#b59662" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#b59662" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {/* Main Content Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/20">
             <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {isAdmin ? 'System-wide Investigations' : 'My Reported Incidents'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Live Audit Tracking</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="hidden md:flex bg-white p-1 rounded-2xl border border-slate-200">
                  {['Pending', 'Completed', 'Rejected'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                      className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95">
                  <Filter className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Reference</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Classification</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Unit / Department</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right pr-12">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#b59662]/10 group-hover:text-[#b59662] transition-colors">
                           <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 tracking-tight">{incident.number}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{incident.date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 font-bold leading-snug">{incident.details}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1">{incident.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                        {incident.dept}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ring-4 ${
                             incident.status === 'Completed' ? 'bg-emerald-500 ring-emerald-50' : 
                             incident.status === 'Pending' ? 'bg-rose-500 ring-rose-50' : 'bg-violet-500 ring-violet-50'
                          }`}></div>
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{incident.status}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right pr-12">
                       <div className="flex items-center justify-end gap-3">
                          <button className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all duration-300 active:scale-95 shadow-sm">
                             <Eye className="w-4.5 h-4.5" />
                          </button>
                          {isAdmin && (
                            <button className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-[#b59662] hover:text-white transition-all duration-300 active:scale-95 shadow-sm">
                               <FileEdit className="w-4.5 h-4.5" />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                        <Zap className="w-16 h-16" />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">No Live Incidents Tracked</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            totalRecords={filteredData.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Personal Quick Tips (Only for Users) */}
        {!isAdmin && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-200">
                 <ShieldCheck className="w-10 h-10 mb-4 opacity-50" />
                 <h5 className="font-black text-sm uppercase tracking-widest mb-2">Patient Safety First</h5>
                 <p className="text-xs text-indigo-50 font-medium opacity-80 leading-relaxed">Ensure all near-misses are reported within 24 hours to maintain our gold standard of care.</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200">
                 <CheckCircle2 className="w-10 h-10 mb-4 opacity-50" />
                 <h5 className="font-black text-sm uppercase tracking-widest mb-2">Latest Guidelines</h5>
                 <p className="text-xs text-emerald-50 font-medium opacity-80 leading-relaxed">Version 4.2 of the Clinical Protocol is now live in the document library. Please review.</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#b59662] to-[#9e8254] text-white shadow-xl shadow-[#b59662]/20">
                 <Activity className="w-10 h-10 mb-4 opacity-50" />
                 <h5 className="font-black text-sm uppercase tracking-widest mb-2">Need Support?</h5>
                 <p className="text-xs text-slate-50 font-medium opacity-80 leading-relaxed">The Quality Assurance team is available 24/7 for incident investigation support.</p>
              </div>
           </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
