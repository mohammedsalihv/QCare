import React from 'react';
import { Check, X, AlertCircle, User } from 'lucide-react';

const ComplianceMatrix = ({ staff, competencies, records }) => {
  const getStatus = (staffId, compId) => {
    const record = records?.find(r => r.staffId?._id === staffId && r.competencyId?._id === compId);
    if (!record) return 'missing';
    if (record.expiryDate && new Date(record.expiryDate) < new Date()) return 'expired';
    return 'compliant';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Staff Member</th>
              {competencies?.map(comp => (
                <th key={comp._id} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">
                   {comp.competencyCode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff?.map((member) => (
              <tr key={member._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors">
                <td className="p-6 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                         <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-900 dark:text-white">{member.employeeName}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{member.department}</span>
                      </div>
                   </div>
                </td>
                {competencies?.map(comp => {
                  const status = getStatus(member._id, comp._id);
                  return (
                    <td key={comp._id} className="p-6 text-center">
                       <div className="flex justify-center">
                          {status === 'compliant' ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-200">
                               <Check className="w-4 h-4" />
                            </div>
                          ) : status === 'expired' ? (
                            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm shadow-rose-200">
                               <AlertCircle className="w-4 h-4 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                               <X className="w-4 h-4" />
                            </div>
                          )}
                       </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplianceMatrix;
