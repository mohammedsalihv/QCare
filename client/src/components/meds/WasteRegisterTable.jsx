import React from 'react';
import { FileText, Download, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

const WasteRegisterTable = ({ wasteLogs, onDownloadManifest }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference / Date</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waste Type</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor / Manifest</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wasteLogs?.map((log) => (
            <tr key={log._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors">
              <td className="p-6">
                 <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.wasteRef}</span>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(log.wasteDate).toLocaleDateString()}</p>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      ['sharps', 'infectious'].includes(log.wasteType) ? 'bg-rose-500' : 
                      ['cytotoxic', 'chemical'].includes(log.wasteType) ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.wasteType}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className="text-xs font-black text-slate-800 dark:text-slate-200">{log.quantityKg} KG</span>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.disposalVendor}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter"># {log.manifestNumber}</span>
                 </div>
              </td>
              <td className="p-6">
                 {log.DOHCompliant ? (
                   <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                   </span>
                 ) : (
                   <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3 h-3" /> Breach
                   </span>
                 )}
              </td>
              <td className="p-6">
                 <button 
                   onClick={() => onDownloadManifest(log._id)}
                   className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                 >
                   <Download className="w-3 h-3" /> Manifest
                 </button>
              </td>
            </tr>
          ))}
          {(!wasteLogs || wasteLogs.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No medical waste logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WasteRegisterTable;
