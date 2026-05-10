import React from 'react';
import { Calendar, AlertTriangle, CheckCircle2, History, PenTool } from 'lucide-react';

const AssetRegisterTable = ({ assets, onMaintenance, onHistory }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-600';
      case 'out-of-calibration': return 'bg-rose-100 text-rose-600';
      case 'under-repair': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getDayCount = (targetDate) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset ID / Name</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Calibration Due</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Criticality</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets?.map((asset) => {
            const daysLeft = getDayCount(asset.nextCalibrationDate);
            return (
              <tr key={asset._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 transition-colors">
                <td className="p-6">
                   <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{asset.assetId}</span>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{asset.equipmentName}</p>
                </td>
                <td className="p-6">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{asset.department}</span>
                </td>
                <td className="p-6">
                   <div className="flex flex-col">
                      <span className={`text-xs font-bold ${daysLeft < 30 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                         {new Date(asset.nextCalibrationDate).toLocaleDateString()}
                      </span>
                      {daysLeft !== null && (
                        <span className={`text-[9px] font-black uppercase ${daysLeft < 30 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                           {daysLeft < 0 ? 'Overdue!' : `${daysLeft} days left`}
                        </span>
                      )}
                   </div>
                </td>
                <td className="p-6">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     asset.criticality === 'life-saving' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                   }`}>
                      {asset.criticality}
                   </span>
                </td>
                <td className="p-6">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                   </span>
                </td>
                <td className="p-6">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => onMaintenance(asset)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Log Maintenance"
                      >
                         <PenTool className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onHistory(asset._id)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                        title="View History"
                      >
                         <History className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            );
          })}
          {(!assets || assets.length === 0) && (
            <tr>
              <td colSpan="6" className="p-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No equipment assets registered.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetRegisterTable;
