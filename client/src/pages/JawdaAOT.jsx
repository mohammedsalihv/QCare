import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
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
      const response = await axios.get('http://192.168.1.160:5000/api/jawda/aot');
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
      await axios.post('http://192.168.1.160:5000/api/jawda/aot', formData);
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
    { label: 'Total Recipients', value: data.length, icon: Users, color: 'text-[#040404]', bg: 'bg-slate-100' },
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
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[var(--color-primary)]">Regulatory</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[var(--color-primary)]">Adult Organ Transplant</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              JAWDA AOT Module <span className="text-sm font-medium text-slate-800 font-semibold ml-2 bg-slate-100 px-2 py-0.5 rounded">V1.3 H2-2025</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-none hover:bg-primary transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Register Recipient
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-[var(--color-primary)] transition-all cursor-default">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{stat.label}</p>
                <p className="text-xl font-semibold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
                  <input type="text" placeholder="Search recipients..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold w-64" />
               </div>
               <button className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-800 hover:bg-white transition-all normal-case tracking-normal">
                  <Filter className="w-3.5 h-3.5" /> Filter
               </button>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Reporting Cycle: Feb 2026 (H2-2025)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200">Recipient ID</th>
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200">Organ / Donor</th>
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200">Transplant Date</th>
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200">1yr Survival</th>
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200">Status</th>
                  <th className="px-8 py-5 text-[12px] font-semibold text-slate-800 normal-case tracking-normal border-b border-slate-200 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length > 0 ? data.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{item.patientId}</span>
                        <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-tight">{item.patientName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[12px] font-semibold normal-case tracking-normal">{item.organType}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded text-[12px] normal-case tracking-normal">{item.donorType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <Calendar className="w-4 h-4 opacity-40" />
                        <span className="text-[13px] font-semibold">{new Date(item.transplantDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="w-[100%] h-full bg-emerald-500"></div>
                          </div>
                          <span className="text-[12px] font-semibold text-emerald-600">Passed</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-semibold normal-case tracking-normal ${
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-800 font-semibold'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-800 font-semibold hover:text-slate-800 transition-all">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Activity className="w-12 h-12" />
                        <p className="text-[12px] font-semibold normal-case tracking-normal">No AOT recipients registered for this period</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
        
        {/* JAWDA Info Card */}
        <div className="bg-white rounded-2xl p-8 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-xl">
                 <h3 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
                    AOT Compliance Notice
                 </h3>
                 <p className="text-slate-800 font-semibold text-sm font-medium leading-relaxed">
                    Per JAWDA V1.3, all transplant centers must report H1 data by August and H2 by February. 
                    Ensure all Day 365 survival status is updated prior to submission. Rolling 2.5-year patient 
                    cohorts are automatically calculated by the system.
                 </p>
              </div>
              <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-800 font-semibold rounded-2xl text-[13px] normal-case tracking-normal flex items-center gap-3 transition-all">
                 Review Submission Manual <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>
        <JawdaAdvisor />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-primary text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                       <Heart className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                       <h3 className="text-lg font-semibold normal-case tracking-tight">Register Recipient</h3>
                       <p className="text-[13px] text-slate-800 font-semibold normal-case tracking-normal">JAWDA AOT V1.3</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45" />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Patient ID</label>
                       <input 
                        required
                        type="text" 
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[var(--color-primary)] text-sm font-semibold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Full Name</label>
                       <input 
                        required
                        type="text" 
                        value={formData.patientName}
                        onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[var(--color-primary)] text-sm font-semibold" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Organ Type</label>
                       <Select 
                        value={formData.organType}
                        onChange={(e) => setFormData({...formData, organType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[var(--color-primary)] text-sm font-semibold appearance-none cursor-pointer"
                       >
                          <option>Kidney</option>
                          <option>Liver</option>
                          <option>Heart</option>
                          <option>Lung</option>
                          <option>Pancreas-Kidney</option>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Donor Type</label>
                       <Select 
                        value={formData.donorType}
                        onChange={(e) => setFormData({...formData, donorType: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[var(--color-primary)] text-sm font-semibold appearance-none cursor-pointer"
                       >
                          <option>Living</option>
                          <option>Deceased</option>
                       </Select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Transplant Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.transplantDate}
                      onChange={(e) => setFormData({...formData, transplantDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[var(--color-primary)] text-sm font-semibold" 
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-800 font-semibold rounded-2xl text-[13px] normal-case tracking-normal hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl text-[13px] font-semibold normal-case tracking-normal shadow-lg shadow-none hover:bg-primary transition-all">Register Recipient</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JawdaAOT;
