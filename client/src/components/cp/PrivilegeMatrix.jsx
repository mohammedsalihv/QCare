import React from 'react';
import { ShieldCheck, Calendar, User, ChevronRight } from 'lucide-react';

const PrivilegeMatrix = ({ privileges }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'pending-approval': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'expired': return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinician Details</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Specialty / Type</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procedures Approved</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry Date</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {privileges?.map((priv) => (
            <tr key={priv._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors group">
              <td className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                       <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                       <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{priv.staffId?.employeeName}</span>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">{priv.staffId?.employeeId}</p>
                    </div>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{priv.specialty}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Type: {priv.privilegeType}</span>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                       {priv.procedures?.filter(p => p.approved).length || 0} / {priv.procedures?.length || 0}
                    </span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase">Procedures</span>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                       {new Date(priv.expiryDate).toLocaleDateString()}
                    </span>
                 </div>
              </td>
              <td className="p-6">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(priv.status)}`}>
                    {priv.status}
                 </span>
              </td>
              <td className="p-6">
                 <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100">
                    View Full List <ChevronRight className="w-3 h-3" />
                 </button>
              </td>
            </tr>
          ))}
          {(!privileges || privileges.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No clinical privileges registered.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PrivilegeMatrix;
