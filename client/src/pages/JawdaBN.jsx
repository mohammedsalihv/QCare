import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Flame, 
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
  ShieldCheck,
  Zap,
  Thermometer,
  Droplets
} from 'lucide-react';
import { useNotification } from '../components/NotificationContext';
import JawdaAdvisor from '../components/JawdaAdvisor';

const JawdaBN = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    tbsa: 0,
    admissionDate: new Date().toISOString().split('T')[0],
    principalDiagnosisCode: 'T20.0',
    status: 'Inpatient'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jawda/bn');
      setData(response.data);
    } catch (err) {
      showNotification('Failed to load BN data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/jawda/bn', formData);
      showNotification('Burn admission registered', 'success');
      setShowModal(false);
      fetchData();
      setFormData({
        patientId: '',
        patientName: '',
        tbsa: 0,
        admissionDate: new Date().toISOString().split('T')[0],
        principalDiagnosisCode: 'T20.0',
        status: 'Inpatient'
      });
    } catch (err) {
      showNotification('Failed to register admission', 'error');
    }
  };

  const stats = [
    { label: 'Total Patients', value: data.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg LOS / TBSA', value: '1.2d', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sepsis Rate', value: '2.1', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Graft Loss', value: '4%', icon: Droplets, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
              <span className="text-[#2dd4bf]">Burn Services</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              JAWDA Burn Module <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">V4 Q1-2026</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export BN Dataset
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Burn Admission
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-orange-500 transition-all cursor-default">
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

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Burn Inpatients</h3>
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 text-[10px] font-bold w-48" />
                 </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Case ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">TBSA %</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Adm. Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Infection Risk</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
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
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.tbsa > 20 ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${item.tbsa}%` }}></div>
                           </div>
                           <span className="text-xs font-bold text-slate-700">{item.tbsa}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        {new Date(item.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${item.tbsa > 20 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          {item.tbsa > 20 ? 'Critical' : 'Moderate'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{item.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center opacity-30">
                        <Flame className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No active burn cases recorded</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Thermometer className="w-32 h-32 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Compliance Tips
              </h4>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">BN001 VAE:</span> Patient must be ventilated ≥4 calendar days. Day of intubation is Day 1.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">BN015 Delayed Excision:</span> Target is &lt;10% for TBSA ≥20% patients.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="text-white font-bold">Exclusions:</span> Friction injuries and traumatic degloving are EXCLUDED from BN KPIs.
                  </p>
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
              View BN Appendix A-C
            </button>
          </div>
        </div>

        {/* JAWDA Performance Notice */}
        <div className="bg-orange-50 rounded-[2.5rem] p-8 border border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">BN Module V4 Effective Q1 2026</h3>
                 <p className="text-sm text-slate-600 font-medium mt-1">Quarterly reporting via JAWDA online portal is mandatory for all licensed burn units.</p>
              </div>
           </div>
           <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">
              Official Guidance <ArrowUpRight className="w-4 h-4" />
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
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                       <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight">New Burn Admission</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">JAWDA BN V4.0</p>
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                       <input 
                        required
                        type="text" 
                        value={formData.patientName}
                        onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TBSA %</label>
                       <input 
                        required
                        type="number" 
                        min="0"
                        max="100"
                        value={formData.tbsa}
                        onChange={(e) => setFormData({...formData, tbsa: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 text-sm font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Date</label>
                       <input 
                        required
                        type="date" 
                        value={formData.admissionDate}
                        onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ICD-10 Burn Code (T20-T32)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. T20.0"
                      value={formData.principalDiagnosisCode}
                      onChange={(e) => setFormData({...formData, principalDiagnosisCode: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 text-sm font-bold" 
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">Add Admission</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JawdaBN;
