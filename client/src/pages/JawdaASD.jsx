import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Puzzle, 
  Plus, 
  Calendar, 
  Search, 
  ChevronRight, 
  Filter, 
  Download, 
  Users,
  Timer,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { useNotification } from '../components/NotificationContext';

const JawdaASD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jawda/asd');
      setData(response.data);
    } catch (err) {
      showNotification('Failed to load ASD data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Timely Access (14d)', value: '94.2%', icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Report Compliance', value: '88.5%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Dx Time', value: '32d', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Referrals', value: data.filter(d => d.status === 'Referred').length, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Regulatory</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#2dd4bf]">Autism Services</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Puzzle className="w-8 h-8 text-indigo-500" />
              JAWDA ASD Module <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">V1.0 Q4-2026</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export JAWDA XML
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Referral
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-[#2dd4bf] transition-all cursor-default">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search referrals..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] text-xs font-bold w-64" />
               </div>
               <button className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">
                  <Filter className="w-3.5 h-3.5" /> Criteria
               </button>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quarterly Reporting: Q1 2026</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Patient ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Timeline Progress</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Gates</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Comorbidity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? data.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.patientId}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ref: {new Date(item.referralDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
                           <span className="text-slate-400">Dx Completion</span>
                           <span className="text-emerald-600">Day 12 / 42</span>
                        </div>
                        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="w-[28%] h-full bg-emerald-500"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.isReportInEMR ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="EMR Documented">
                             <LayoutGrid className="w-4 h-4" />
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.isReportProvidedToParents ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Provided to Parents">
                             <Users className="w-4 h-4" />
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.coexistingConditionAssessmentDate ? 'bg-emerald-500' : 'bg-slate-200 animate-pulse'}`}></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.coexistingConditionAssessmentDate ? 'Completed' : 'Pending'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'Diagnosed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        item.status === 'InAssessment' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Puzzle className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No ASD referrals registered in this hub</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Compliance Footer */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-xl">
                 <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#2dd4bf]" />
                    ASD Diagnostic Hub Standards
                 </h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Referrals must attend initial assessment within 14 calendar days (ASD001). 
                    Diagnostic reports must be documented in EMR and provided to parents within 42 days (ASD002). 
                    Reporting is mandatory on a quarterly basis via the JAWDA portal.
                 </p>
              </div>
              <button className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all">
                 View DOH Standards <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JawdaASD;
