import Table from '../Table.jsx';
import React from 'react';
import { FileText, CheckCircle2, Clock, Users } from 'lucide-react';

const CircularList = ({ circulars, onAcknowledge, currentUserId }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 ">
        <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-800" />
          DOH Circulars & Notifications
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 ">
              <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Circular</th>
              <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Issue Date</th>
              <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center">Deadline</th>
              <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center">Compliance</th>
              <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {circulars.map((circ) => {
              const isAcknowledged = circ.acknowledgments?.some(a => a.userId === currentUserId);
              const ackCount = circ.acknowledgments?.length || 0;
              // Assuming a total staff count for compliance bar, e.g. 50
              const complianceRate = Math.min((ackCount / 50) * 100, 100).toFixed(0);

              return (
                <tr key={circ._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-slate-800">{circ.circularNumber}</span>
                      <span className="text-sm font-semibold text-slate-800 line-clamp-1">{circ.title}</span>
                      {circ.title_ar && <span className="text-[13px] text-slate-800 font-semibold text-right font-arabic" dir="rtl">{circ.title_ar}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[13px] font-medium text-slate-800 font-semibold">{new Date(circ.issuedDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-center">
                    {circ.acknowledgmentDeadline ? (
                      <span className={`text-[13px] font-semibold ${new Date(circ.acknowledgmentDeadline) < new Date() ? 'text-rose-600' : 'text-slate-800 font-semibold'}`}>
                        {new Date(circ.acknowledgmentDeadline).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${complianceRate}%` }}></div>
                      </div>
                      <span className="text-[12px] font-semibold text-emerald-600">{complianceRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {isAcknowledged ? (
                      <div className="flex items-center justify-end gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[12px] font-semibold normal-case">Acknowledged</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAcknowledge(circ._id)}
                        className="px-4 py-1.5 bg-primary hover:bg-primary text-white text-[12px] font-semibold rounded-lg normal-case tracking-normal shadow-lg shadow-[#040404]/20 transition-all active:scale-95"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default CircularList;
