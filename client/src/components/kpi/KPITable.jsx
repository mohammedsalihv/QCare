import Table from '../Table.jsx';
import React from 'react';
import { Edit2, Send, CheckCircle2, Clock } from 'lucide-react';

const KPITable = ({ kpis, onEdit, onSubmit, userRole }) => {
  const isQualityManager = userRole === 'QualityManager' || userRole === 'SuperAdmin';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on-track':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[13px] font-semibold rounded-full normal-case">On Track</span>;
      case 'at-risk':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[13px] font-semibold rounded-full normal-case">At Risk</span>;
      case 'breached':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-[13px] font-semibold rounded-full normal-case">Breached</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 font-semibold text-[13px] rounded-full normal-case">{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 ">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 ">
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Code</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Indicator Name</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Category</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Target</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Actual</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal text-center">DOH</th>
            <th className="p-4 text-sm font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(kpis) && kpis.map((kpi) => (
            <tr key={kpi._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="p-4 font-semibold text-slate-800">{kpi.indicatorCode}</td>
              <td className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{kpi.indicatorName}</span>
                  {kpi.indicatorName_ar && (
                    <span className="text-[13px] text-slate-800 font-semibold text-right" dir="rtl">{kpi.indicatorName_ar}</span>
                  )}
                </div>
              </td>
              <td className="p-4">
                <span className="text-[13px] font-medium text-slate-800 font-semibold bg-slate-100 px-2 py-1 rounded-lg capitalize">
                  {kpi.category.replace('-', ' ')}
                </span>
              </td>
              <td className="p-4 font-medium">{kpi.target === null ? 'Not specified' : `${kpi.calculationRule?.targetStrict ? '< ' : kpi.calculationRule?.targetDirection === 'lower' ? '≤ ' : '≥ '}${kpi.target}${kpi.unit || '%'}`}</td>
              <td className="p-4">
                <span className={`font-semibold ${kpi.status === 'breached' ? 'text-red-600' : 'text-slate-800 font-semibold'}`}>
                  {kpi.calculatedValue === null ? 'No data' : `${kpi.calculatedValue}${kpi.unit === 'days' ? ' days' : kpi.unit || '%'}`}
                </span>
              </td>
              <td className="p-4">{getStatusBadge(kpi.status)}</td>
              <td className="p-4 text-center">
                {kpi.submittedToDOH ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-800 font-semibold mx-auto" />
                )}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  {isQualityManager && (
                    <>
                      <button
                        onClick={() => onEdit(kpi)}
                        className="p-2 text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Indicator"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!kpi.submittedToDOH && (
                        <button
                          onClick={() => onSubmit(kpi._id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Submit to DOH"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(!Array.isArray(kpis) || kpis.length === 0) && (
            <tr>
              <td colSpan="8" className="p-10 text-center text-slate-800 font-semibold">
                No indicators found for this period.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default KPITable;
