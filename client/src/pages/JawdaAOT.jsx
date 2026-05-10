import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Heart, 
  Plus, 
  Calendar, 
  Search, 
  ChevronRight, 
  Filter, 
  Download, 
  Users,
  Activity,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useNotification } from '../components/NotificationContext';
import JawdaAdvisor from '../components/JawdaAdvisor';

const JawdaAOT = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    organType: 'Kidney',
    donorType: 'Living',
    transplantDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jawda/aot');
      setData(response.data);
    } catch (err) {
      showNotification('Failed to load AOT data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jawda/aot', formData);
      showNotification('Recipient registered successfully', 'success');
      setShowModal(false);
      fetchData();
      setFormData({
        patientId: '',
        patientName: '',
        organType: 'Kidney',
        donorType: 'Living',
        transplantDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    } catch (err) {
      showNotification('Failed to register recipient', 'error');
    }
  };

  const stats = [
    { label: 'Total Recipients', value: data.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '1yr Survival', value: '96.4%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Waitlist Mortality', value: '4.2', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Avg Wait Time', value: '284d', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
              <span className="text-[#2dd4bf]">Adult Organ Transplant</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              JAWDA AOT Module <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">V1.3 H2-2025</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Register Recipient
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
                  <input type="text" placeholder="Search recipients..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] text-xs font-bold w-64" />
               </div>
               <button className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">
                  <Filter className="w-3.5 h-3.5" /> Filter
               </button>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Cycle: Feb 2026 (H2-2025)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Recipient ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Organ / Donor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Transplant Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">1yr Survival</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? data.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.patientId}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.patientName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest">{item.organType}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">{item.donorType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 opacity-40" />
                        <span className="text-xs font-bold">{new Date(item.transplantDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="w-[100%] h-full bg-emerald-500"></div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">Passed</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Activity className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No AOT recipients registered for this period</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* JAWDA Info Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-xl">
                 <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#2dd4bf]" />
                    AOT Compliance Notice
                 </h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Per JAWDA V1.3, all transplant centers must report H1 data by August and H2 by February. 
                    Ensure all Day 365 survival status is updated prior to submission. Rolling 2.5-year patient 
                    cohorts are automatically calculated by the system.
                 </p>
              </div>
              <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all">
                 Review Submission Manual <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>
        <JawdaAdvisor />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                       <Heart className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight">Register Recipient</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">JAWDA AOT V1.3</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient ID</label>
                       <input 
                        required
                        type="text" 
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2dd4bf] text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                       <input 
                        required
                        type="text" 
                        value={formData.patientName}
                        onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2dd4bf] text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organ Type</label>
                       <select 
                        value={formData.organType}
                        onChange={(e) => setFormData({...formData, organType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2dd4bf] text-sm font-bold appearance-none cursor-pointer"
                       >
                          <option>Kidney</option>
                          <option>Liver</option>
                          <option>Heart</option>
                          <option>Lung</option>
                          <option>Pancreas-Kidney</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donor Type</label>
                       <select 
                        value={formData.donorType}
                        onChange={(e) => setFormData({...formData, donorType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2dd4bf] text-sm font-bold appearance-none cursor-pointer"
                       >
                          <option>Living</option>
                          <option>Deceased</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transplant Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.transplantDate}
                      onChange={(e) => setFormData({...formData, transplantDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2dd4bf] text-sm font-bold" 
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">Register Recipient</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JawdaAOT;
