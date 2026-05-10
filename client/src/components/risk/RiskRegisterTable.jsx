import React from 'react';
import { Eye, Edit3, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';

const RiskRegisterTable = ({ risks, onView, onEdit }) => {
  const getLevelBadge = (level) => {
    const styles = {
      critical: 'bg-rose-100 text-rose-700 border-rose-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${styles[level] || styles.low}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk ID & Title</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Inherent</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Residual</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Owner</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Review Due</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors group">
                <td className="p-6">
                   <div className="flex flex-col max-w-xs">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">{risk.riskId}</span>
                     <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{risk.riskTitle}</span>
                   </div>
                </td>
                <td className="p-6">
                   <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">
                     {risk.riskCategory}
                   </span>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-slate-900">{risk.riskScore}</span>
                      {getLevelBadge(risk.riskLevel)}
                   </div>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-black text-slate-900">{risk.residualScore || '-'}</span>
                      {risk.residualLevel ? getLevelBadge(risk.residualLevel) : <span className="text-[10px] text-slate-300">N/A</span>}
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        {risk.owner?.employeeName?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{risk.owner?.employeeName}</span>
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex flex-col">
                      <span className={`text-xs font-bold ${risk.status === 'overdue' ? 'text-rose-600' : 'text-slate-600'}`}>
                         {risk.reviewDate ? new Date(risk.reviewDate).toLocaleDateString() : 'Not Set'}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-400 mt-1">{risk.status}</span>
                   </div>
                </td>
                <td className="p-6 text-right">
                   <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onView(risk._id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                         <Eye className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => onEdit(risk._id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                         <Edit3 className="w-4.5 h-4.5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
            {risks.length === 0 && (
              <tr>
                <td colSpan="7" className="p-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">
                   No risks found in the register
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskRegisterTable;
