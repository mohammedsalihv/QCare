import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Activity, 
  Plus, 
  Calendar, 
  Search, 
  ChevronRight, 
  Filter, 
  Download, 
  Users,
  Droplets,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Thermometer,
  Stethoscope
} from 'lucide-react';
import { useNotification } from '../components/NotificationContext';
import JawdaAdvisor from '../components/JawdaAdvisor';

const JawdaDF = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    reportingMonth: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
    kt_v_value: 1.2,
    hemoglobin: 110,
    albumin: 35,
    dialysisModality: 'HD',
    catheterStatus: { hasCatheter: false }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jawda/df');
      setData(response.data);
    } catch (err) {
      showNotification('Failed to load DF data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jawda/df', formData);
      showNotification('Patient-month record added', 'success');
      setShowModal(false);
      fetchData();
      setFormData({
        patientId: '',
        patientName: '',
        reportingMonth: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
        kt_v_value: 1.2,
        hemoglobin: 110,
        albumin: 35,
        dialysisModality: 'HD',
        catheterStatus: { hasCatheter: false }
      });
    } catch (err) {
      showNotification('Failed to add record', 'error');
    }
  };

  const stats = [
    { label: 'Patient-Months (Q1)', value: data.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kt/V Compliance', value: '88%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Anemia Target', value: '72%', icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'LT Catheter Rate', value: '14%', icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50' },
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
              <span className="text-[#2dd4bf]">Dialysis Facilities</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Droplets className="w-8 h-8 text-blue-500" />
              JAWDA Dialysis Module <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">V10 Q1-2026</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export Quarterly Dataset
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Patient-Month
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-500 transition-all cursor-default">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Monthly Clinical Metrics</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Cycle: Q1 2026</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kt/V</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hb (g/L)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Albumin</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Modality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length > 0 ? data.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.patientId}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`text-xs font-bold ${item.kt_v_value >= 1.2 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {item.kt_v_value}
                           </span>
                           <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.kt_v_value >= 1.2 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(item.kt_v_value * 50, 100)}%` }}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        {item.hemoglobin} <span className="text-[9px] text-slate-400">g/L</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${item.albumin >= 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {item.albumin} g/L
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${item.dialysisModality === 'HD' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {item.dialysisModality}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center opacity-30">
                        <Droplets className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No patient-month data submitted</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Droplets className="w-32 h-32 text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4" /> V10 Patient-Month Rules
              </h4>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">Standard Denominator:</span> Requires ≥90 days treatment at the same facility.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">DF002 BSI:</span> Requires ≥21-day gap between positive cultures to count as a new event.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">DF007 Anemia:</span> Hb &gt; 120 g/L is acceptable IF no ESA was given in the prior month.
                  </p>
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
              Calculations Guide
            </button>
          </div>
        </div>

        {/* JAWDA Info */}
        <div className="bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">DF Module V10 Effective Q1 2026</h3>
                 <p className="text-sm text-slate-600 font-medium mt-1">Reporting is based on summed patient-months across the quarter.</p>
              </div>
           </div>
           <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">
              Official Manual <ArrowUpRight className="w-4 h-4" />
           </button>
        </div>

        <JawdaAdvisor />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                       <Droplets className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight">Add Patient-Month</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">JAWDA DF V10.0</p>
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Month</label>
                       <input 
                        required
                        type="month" 
                        value={formData.reportingMonth.substring(0, 7)}
                        onChange={(e) => setFormData({...formData, reportingMonth: e.target.value + '-01'})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kt/V</label>
                       <input 
                        required
                        type="number" 
                        step="0.1"
                        value={formData.kt_v_value}
                        onChange={(e) => setFormData({...formData, kt_v_value: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hb (g/L)</label>
                       <input 
                        required
                        type="number" 
                        value={formData.hemoglobin}
                        onChange={(e) => setFormData({...formData, hemoglobin: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Albumin</label>
                       <input 
                        required
                        type="number" 
                        value={formData.albumin}
                        onChange={(e) => setFormData({...formData, albumin: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modality</label>
                    <div className="flex gap-4">
                       {['HD', 'HHD', 'PD'].map(m => (
                          <button 
                            key={m}
                            type="button"
                            onClick={() => setFormData({...formData, dialysisModality: m})}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.dialysisModality === m ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                          >
                             {m}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">Save Month Data</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JawdaDF;
