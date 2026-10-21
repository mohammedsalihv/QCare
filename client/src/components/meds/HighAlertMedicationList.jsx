import React from 'react';
import { ShieldAlert, AlertTriangle, Search, Plus, Info } from 'lucide-react';

const HighAlertMedicationList = ({ medications }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
            <input 
              type="text" 
              placeholder="Search high-alert formulary..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-100 text-[13px] font-semibold outline-none focus:border-rose-500 transition-all"
            />
         </div>
         <button className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register Med
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {medications?.map((med) => (
           <div key={med._id} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                 <ShieldAlert className="w-12 h-12 text-rose-600" />
              </div>
              
              <div className="flex items-start justify-between mb-6">
                 <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[12px] font-semibold normal-case tracking-normal rounded-full">
                    {med.category}
                 </span>
                 {med.requiresDoubleCheck && (
                    <div title="Independent Double Check Required" className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                       <ShieldAlert className="w-4 h-4" />
                    </div>
                 )}
              </div>

              <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">{med.medicationName}</h3>
              <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal mt-1">Generic: {med.genericName}</p>

              <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                 <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-semibold text-slate-800 leading-relaxed normal-case">
                       {med.warningLabel || 'Standard high-alert precautions apply.'}
                    </p>
                 </div>
                 <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-slate-800 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-semibold text-slate-800 leading-relaxed normal-case">
                       {med.storageRequirements}
                    </p>
                 </div>
              </div>

              <button className="mt-8 w-full py-4 bg-slate-50 text-slate-800 font-semibold text-[12px] normal-case tracking-normal rounded-2xl hover:bg-primary hover:text-white transition-all">
                 View Administration Guide
              </button>
           </div>
         ))}
      </div>
    </div>
  );
};

export default HighAlertMedicationList;
