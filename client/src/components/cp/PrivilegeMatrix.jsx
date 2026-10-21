import Table from '../Table.jsx';
import React from 'react';
import { ShieldCheck, Calendar, User, ChevronRight } from 'lucide-react';

const PrivilegeMatrix = ({ privileges }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'pending-approval': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'expired': return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-black font-bold border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Clinician Details</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Specialty / Type</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Procedures Approved</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Expiry Date</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {privileges?.map((priv) => (
            <tr key={priv._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
              <td className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                       <User className="w-5 h-5 text-slate-800 font-semibold" />
                    </div>
                    <div>
                       <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight">{priv.staffId?.employeeName}</span>
                       <p className="text-[12px] font-semibold text-slate-800 normal-case">{priv.staffId?.employeeId}</p>
                    </div>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{priv.specialty}</span>
                    <span className="text-[12px] font-semibold text-slate-800 normal-case">Type: {priv.privilegeType}</span>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-slate-800">
                       {priv.procedures?.filter(p => p.approved).length || 0} / {priv.procedures?.length || 0}
                    </span>
                    <span className="text-[12px] font-semibold text-emerald-500 normal-case">Procedures</span>
                 </div>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-800 font-semibold" />
                    <span className="text-[13px] font-semibold text-slate-800">
                       {new Date(priv.expiryDate).toLocaleDateString()}
                    </span>
                 </div>
              </td>
              <td className="p-6">
                 <span className={`px-4 py-1.5 rounded-full text-[12px] font-semibold normal-case tracking-normal border ${getStatusBadge(priv.status)}`}>
                    {priv.status}
                 </span>
              </td>
              <td className="p-6">
                 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all opacity-0 group-hover:opacity-100">
                    View Full List <ChevronRight className="w-3 h-3" />
                 </button>
              </td>
            </tr>
          ))}
          {(!privileges || privileges.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[12px] font-semibold text-slate-800 normal-case tracking-normal">
                No clinical privileges registered.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PrivilegeMatrix;
