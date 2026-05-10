import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

const StaffComplianceView = ({ compliance }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'compliant': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Current' };
      case 'expired': return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Overdue' };
      case 'missing': return { icon: XCircle, color: 'text-slate-300', bg: 'bg-slate-50', label: 'Not Attempted' };
      default: return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Expiring Soon' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
         <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Mandatory DOH Competencies</h3>
      </div>
      <div className="p-8 space-y-4">
         {compliance?.map((item, idx) => {
           const info = getStatusInfo(item.status);
           return (
             <div key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-2xl ${info.bg} ${info.color}`}>
                      <info.icon className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.code}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-12">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Completed</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                         {item.lastCompleted ? new Date(item.lastCompleted).toLocaleDateString() : '—'}
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Renewal Due</p>
                      <p className={`text-xs font-bold ${item.status === 'expired' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                         {item.expiry ? new Date(item.expiry).toLocaleDateString() : '—'}
                      </p>
                   </div>
                   <div className="w-24 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${info.bg} ${info.color}`}>
                         {info.label}
                      </span>
                   </div>
                </div>
             </div>
           );
         })}
         {(!compliance || compliance.length === 0) && (
           <div className="text-center py-20 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              No mandatory competencies defined for this role.
           </div>
         )}
      </div>
    </div>
  );
};

export default StaffComplianceView;
