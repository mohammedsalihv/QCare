import Table from '../Table.jsx';
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal sticky left-0 bg-slate-50 z-10">Staff Member</th>
              {competencies?.map(comp => (
                <th key={comp._id} className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center whitespace-nowrap">
                   {comp.competencyCode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff?.map((member) => (
              <tr key={member._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-6 sticky left-0 bg-white z-10 border-r border-slate-50 ">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                         <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[13px] font-semibold text-slate-800 ">{member.employeeName}</span>
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
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-semibold">
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
        </Table>
      </div>
    </div>
  );
};

export default ComplianceMatrix;
