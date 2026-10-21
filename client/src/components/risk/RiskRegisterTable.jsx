import Table from '../Table.jsx';
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
      <span className={`px-2.5 py-1 text-[12px] font-semibold normal-case rounded-lg border ${styles[level] || styles.low}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Risk ID & Title</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Category</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center">Inherent</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center">Residual</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Owner</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Review Due</th>
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                <td className="p-6">
                   <div className="flex flex-col max-w-xs">
                     <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">{risk.riskId}</span>
                     <span className="text-sm font-semibold text-slate-800 line-clamp-2">{risk.riskTitle}</span>
                   </div>
                </td>
                <td className="p-6">
                   <span className="text-[12px] font-semibold text-slate-800 normal-case bg-slate-100 px-2 py-1 rounded-md">
                     {risk.riskCategory}
                   </span>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[13px] font-semibold text-slate-800">{risk.riskScore}</span>
                      {getLevelBadge(risk.riskLevel)}
                   </div>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[13px] font-semibold text-slate-800">{risk.residualScore || '-'}</span>
                      {risk.residualLevel ? getLevelBadge(risk.residualLevel) : <span className="text-[12px] text-slate-800 font-semibold">N/A</span>}
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-semibold text-[12px]">
                        {risk.owner?.employeeName?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">{risk.owner?.employeeName}</span>
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex flex-col">
                      <span className={`text-[13px] font-semibold ${risk.status === 'overdue' ? 'text-rose-600' : 'text-slate-800 font-semibold'}`}>
                         {risk.reviewDate ? new Date(risk.reviewDate).toLocaleDateString() : 'Not Set'}
                      </span>
                      <span className="text-[12px] font-semibold normal-case text-slate-800 mt-1">{risk.status}</span>
                   </div>
                </td>
                <td className="p-6 text-right">
                   <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onView(risk._id)}
                        className="p-2 text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                      >
                         <Eye className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => onEdit(risk._id)}
                        className="p-2 text-slate-800 font-semibold hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                         <Edit3 className="w-4.5 h-4.5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
            {risks.length === 0 && (
              <tr>
                <td colSpan="7" className="p-20 text-center text-slate-800 font-semibold normal-case text-[13px] tracking-normal">
                   No risks found in the register
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default RiskRegisterTable;
