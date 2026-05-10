import React from 'react';
import { Eye, Clock, AlertTriangle, ShieldAlert, CheckCircle2, User } from 'lucide-react';

const ComplaintTable = ({ complaints, onView }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-600';
      case 'acknowledged': return 'bg-purple-100 text-purple-600';
      case 'investigating': return 'bg-amber-100 text-amber-600';
      case 'resolved': return 'bg-emerald-100 text-emerald-600';
      case 'closed': return 'bg-slate-100 text-slate-600';
      case 'escalated': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient / MRN</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Severity</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints?.map((item) => (
            <tr key={item._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors group">
              <td className="p-6">
                 <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.complaintRef}</span>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(item.dateReceived).toLocaleDateString()}</p>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.patientName}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">MRN: {item.patientMRN || 'N/A'}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category?.replace('-', ' ')}</span>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    {getSeverityIcon(item.severity)}
                    <span className="text-[10px] font-black uppercase text-slate-600">{item.severity}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(item.status)}`}>
                    {item.status}
                 </span>
              </td>
              <td className="p-6">
                 <button 
                   onClick={() => onView(item._id)}
                   className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                 >
                   <Eye className="w-4 h-4" />
                 </button>
              </td>
            </tr>
          ))}
          {(!complaints || complaints.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No complaint records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintTable;
