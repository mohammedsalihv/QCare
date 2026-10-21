import Table from '../Table.jsx';
import React from 'react';
import { FileText, Download, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

const WasteRegisterTable = ({ wasteLogs, onDownloadManifest }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Reference / Date</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Waste Type</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Quantity</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Vendor / Manifest</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Compliance</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wasteLogs?.map((log) => (
            <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="p-6">
                 <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight">{log.wasteRef}</span>
                 <p className="text-[12px] font-semibold text-slate-800 normal-case mt-0.5">{new Date(log.wasteDate).toLocaleDateString()}</p>
              </td>
              <td className="p-6">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      ['sharps', 'infectious'].includes(log.wasteType) ? 'bg-rose-500' : 
                      ['cytotoxic', 'chemical'].includes(log.wasteType) ? 'bg-amber-500' : 'bg-primary'
                    }`} />
                    <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{log.wasteType}</span>
                 </div>
              </td>
              <td className="p-6">
                 <span className="text-[13px] font-semibold text-slate-800">{log.quantityKg} KG</span>
              </td>
              <td className="p-6">
                 <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-slate-800">{log.disposalVendor}</span>
                    <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-tighter"># {log.manifestNumber}</span>
                 </div>
              </td>
              <td className="p-6">
                 {log.DOHCompliant ? (
                   <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[12px] font-semibold normal-case tracking-normal rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                   </span>
                 ) : (
                   <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[12px] font-semibold normal-case tracking-normal rounded-full flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3 h-3" /> Breach
                   </span>
                 )}
              </td>
              <td className="p-6">
                 <button 
                   onClick={() => onDownloadManifest(log._id)}
                   className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all shadow-lg shadow-slate-200"
                 >
                   <Download className="w-3 h-3" /> Manifest
                 </button>
              </td>
            </tr>
          ))}
          {(!wasteLogs || wasteLogs.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[12px] font-semibold text-slate-800 normal-case tracking-normal">
                No medical waste logs found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default WasteRegisterTable;
