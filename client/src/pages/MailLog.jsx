import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Search, 
  ChevronRight, 
  Mail,
  ShieldCheck,
  Eye,
  X,
  Calendar,
  User,
  RefreshCcw,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

const MailLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://192.168.1.160:5000/api/settings/mail-logs', getAuthConfig());
      setLogs(data);
    } catch (err) {
      console.error('Error fetching mail logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return (l.moduleName || '').toLowerCase().includes(q) ||
      (l.pageName || '').toLowerCase().includes(q) ||
      (l.mailSubject || '').toLowerCase().includes(q) ||
      (l.fromMail || '').toLowerCase().includes(q) ||
      (l.toMail || '').toLowerCase().includes(q) ||
      (l.toMailUserName || '').toLowerCase().includes(q) ||
      (l.submittedBy || '').toLowerCase().includes(q);
  });

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);

  // Stats
  const totalSent = logs.length;
  const CanadianCMCSent = logs.filter(l => l.fromMail?.includes('canadiancmc')).length;
  const sentToday = logs.filter(l => {
    const sentDate = new Date(l.sentAt);
    const today = new Date();
    return sentDate.getDate() === today.getDate() &&
      sentDate.getMonth() === today.getMonth() &&
      sentDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1 text-black">
              <span>Home</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">System Logs & Config</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Mail Log</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black">Mail Log Center</h1>
          </div>
          <button 
            onClick={fetchLogs} 
            className="flex items-center gap-3 px-5 py-3.5 border border-slate-200 bg-white text-slate-700 hover:border-slate-800 hover:text-slate-900 rounded-md font-bold transition-all shadow-sm active:scale-95 text-xs font-black uppercase tracking-wider"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Mail Sent', value: totalSent, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200', icon: Send },
            { label: 'Canadian CMC Origin', value: CanadianCMCSent, color: 'text-[var(--color-primary)]', bg: 'bg-amber-50/50 border-amber-200', icon: Mail },
            { label: 'Sent Today', value: sentToday, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 }
          ].map((stat, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${stat.bg} flex items-center gap-4 shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center ${stat.color} shadow-inner-sm`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by module, subject, sender, or recipient..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 text-xs font-semibold transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-16 px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">S.No</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Module Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Page Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Mail Subject</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">From Mail ID</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">To Mail ID</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">To Mail User Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Submitted By</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Sent Date & Time</th>
                  <th className="w-20 px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200 text-right pr-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-20 text-center text-xs font-semibold text-slate-500">
                       Loading mail logs from database...
                    </td>
                  </tr>
                ) : currentRecords.map((log, index) => {
                  const sNo = indexOfFirst + index + 1;
                  const dateStr = log.sentAt ? new Date(log.sentAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(',', '') : 'Not Applicable';

                  return (
                    <tr key={log._id || log.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{sNo}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">{log.moduleName}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">{log.pageName}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-850 leading-relaxed max-w-[200px] truncate" title={log.mailSubject}>
                        {log.mailSubject}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-mono">{log.fromMail}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-mono">{log.toMail}</td>
                      <td className="px-6 py-4 text-xs text-slate-800 font-semibold">{log.toMailUserName}</td>
                      <td className="px-6 py-4 text-xs text-slate-700">{log.submittedBy}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-650">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        <button 
                          onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                          className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all active:scale-95 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Mail className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">No mail logs found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            totalRecords={filtered.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowDetailModal(false)} />
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                    <Mail className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Email Details</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{selectedLog.moduleName} | {selectedLog.pageName}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 active:scale-95 shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 space-y-4 bg-white">
                {[
                  { label: 'From Address', value: selectedLog.fromMail },
                  { label: 'To Address', value: selectedLog.toMail },
                  { label: 'To User Name', value: selectedLog.toMailUserName },
                  { label: 'Subject', value: selectedLog.mailSubject },
                  { label: 'Submitted By', value: selectedLog.submittedBy },
                  { label: 'Date Sent', value: selectedLog.sentAt ? new Date(selectedLog.sentAt).toLocaleString() : 'N/A' }
                ].map(row => (
                  <div key={row.label} className="flex gap-4 border-b border-slate-50 pb-3 last:border-0">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider w-28 shrink-0 mt-0.5">{row.label}</span>
                    <span className="text-xs font-semibold text-slate-800 break-all leading-relaxed">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-[10px] font-bold text-slate-800 uppercase">QCare Mail Delivery Registry</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise Communication Log</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MailLog;
