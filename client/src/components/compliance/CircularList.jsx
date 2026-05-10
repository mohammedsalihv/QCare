import React from 'react';
import { FileText, CheckCircle2, Clock, Users } from 'lucide-react';

const CircularList = ({ circulars, onAcknowledge, currentUserId }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          DOH Circulars & Notifications
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Circular</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deadline</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Compliance</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {circulars.map((circ) => {
              const isAcknowledged = circ.acknowledgments?.some(a => a.userId === currentUserId);
              const ackCount = circ.acknowledgments?.length || 0;
              // Assuming a total staff count for compliance bar, e.g. 50
              const complianceRate = Math.min((ackCount / 50) * 100, 100).toFixed(0);

              return (
                <tr key={circ._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{circ.circularNumber}</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400 line-clamp-1">{circ.title}</span>
                      {circ.title_ar && <span className="text-xs text-slate-400 text-right font-arabic" dir="rtl">{circ.title_ar}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-slate-500">{new Date(circ.issuedDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-center">
                    {circ.acknowledgmentDeadline ? (
                      <span className={`text-xs font-bold ${new Date(circ.acknowledgmentDeadline) < new Date() ? 'text-rose-600' : 'text-slate-600'}`}>
                        {new Date(circ.acknowledgmentDeadline).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${complianceRate}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600">{complianceRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {isAcknowledged ? (
                      <div className="flex items-center justify-end gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">Acknowledged</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAcknowledge(circ._id)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CircularList;
