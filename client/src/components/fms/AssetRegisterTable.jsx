import Table from '../Table.jsx';
import React from 'react';
import { Calendar, AlertTriangle, CheckCircle2, History, PenTool } from 'lucide-react';

const AssetRegisterTable = ({ assets, onMaintenance, onHistory }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-600';
      case 'out-of-calibration': return 'bg-rose-100 text-rose-600';
      case 'under-repair': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 text-black font-bold';
    }
  };

  const getDayCount = (targetDate) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Asset ID / Name</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Department</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Calibration Due</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Criticality</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets?.map((asset) => {
            const daysLeft = getDayCount(asset.nextCalibrationDate);
            return (
              <tr key={asset._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-6">
                   <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight">{asset.assetId}</span>
                   <p className="text-[12px] font-semibold text-slate-800 normal-case mt-0.5">{asset.equipmentName}</p>
                </td>
                <td className="p-6">
                   <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{asset.department}</span>
                </td>
                <td className="p-6">
                   <div className="flex flex-col">
                      <span className={`text-[13px] font-semibold ${daysLeft < 30 ? 'text-rose-600' : 'text-slate-800 font-semibold'}`}>
                         {new Date(asset.nextCalibrationDate).toLocaleDateString()}
                      </span>
                      {daysLeft !== null && (
                        <span className={`text-[12px] font-semibold normal-case ${daysLeft < 30 ? 'text-rose-400 animate-pulse' : 'text-slate-800 font-semibold'}`}>
                           {daysLeft < 0 ? 'Overdue!' : `${daysLeft} days left`}
                        </span>
                      )}
                   </div>
                </td>
                <td className="p-6">
                   <span className={`px-3 py-1 rounded-full text-[12px] font-semibold normal-case tracking-normal ${
                     asset.criticality === 'life-saving' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-800 font-semibold'
                   }`}>
                      {asset.criticality}
                   </span>
                </td>
                <td className="p-6">
                   <span className={`px-3 py-1 rounded-full text-[12px] font-semibold normal-case tracking-normal ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                   </span>
                </td>
                <td className="p-6">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => onMaintenance(asset)}
                        className="p-2 bg-slate-100 text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                        title="Log Maintenance"
                      >
                         <PenTool className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onHistory(asset._id)}
                        className="p-2 bg-slate-100 text-slate-800 font-semibold hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
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
              <td colSpan="6" className="p-20 text-center text-[12px] font-semibold text-slate-800 normal-case tracking-normal">
                No equipment assets registered.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default AssetRegisterTable;
