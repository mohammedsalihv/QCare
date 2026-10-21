import Table from '../Table.jsx';
import React from 'react';
import { Eye, Clock, AlertTriangle, ShieldAlert, CheckCircle2, User } from 'lucide-react';

const ComplaintTable = ({ complaints, onView }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'bg-slate-100 text-[#040404]';
      case 'acknowledged': return 'bg-purple-100 text-purple-600';
      case 'investigating': return 'bg-amber-100 text-amber-600';
      case 'resolved': return 'bg-emerald-100 text-emerald-600';
      case 'closed': return 'bg-slate-100 text-black font-bold';
      case 'escalated': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-black font-bold';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-slate-800" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Reference</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Patient / MRN</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Category</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Severity</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints?.map((item) => (
            <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
              <td className="p-6">
                 <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight">{item.complaintRef}</span>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case mt-0.5">{new Date(item.dateReceived).toLocaleDateString()}</p>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-slate-800">{item.patientName}</span>
                    <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-tighter">MRN: {item.patientMRN || 'N/A'}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{item.category?.replace('-', ' ')}</span>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    {getSeverityIcon(item.severity)}
                    <span className="text-[12px] font-semibold normal-case text-slate-800">{item.severity}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className={`px-3 py-1 rounded-full text-[12px] font-semibold normal-case tracking-normal ${getStatusBadge(item.status)}`}>
                    {item.status}
                 </span>
              </td>
              <td className="p-6">
                 <button 
                   onClick={() => onView(item._id)}
                   className="p-2 bg-slate-100 text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                 >
                   <Eye className="w-4 h-4" />
                 </button>
              </td>
            </tr>
          ))}
          {(!complaints || complaints.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[12px] font-semibold text-slate-800 normal-case tracking-normal">
                No complaint records found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default ComplaintTable;
