import React from 'react';
import { ShieldAlert, Users, Calendar, AlertCircle, CheckCircle2, ChevronRight, Bell } from 'lucide-react';

const OutbreakManager = ({ outbreaks, onSelect }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'suspected': return 'bg-amber-100 text-amber-600';
      case 'confirmed': return 'bg-rose-100 text-rose-600';
      case 'contained': return 'bg-slate-100 text-[#040404]';
      case 'closed': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-black font-bold';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outbreaks?.map((ob) => (
          <div key={ob._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
             <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div className={`px-4 py-1 rounded-full text-[12px] font-semibold normal-case tracking-normal ${getStatusBadge(ob.status)}`}>
                   {ob.status}
                </div>
                <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{ob.alertRef}</span>
             </div>
             
             <div className="p-8 space-y-6">
                <div>
                   <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">{ob.infectionType} Outbreak</h3>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{ob.affectedWard} Ward</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                      <Users className="w-4 h-4 text-slate-800 font-semibold mb-1" />
                      <span className="text-lg font-semibold text-slate-800 ">{ob.currentCaseCount}</span>
                      <span className="text-[12px] font-semibold text-slate-800 normal-case">Total Cases</span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                      <Calendar className="w-4 h-4 text-slate-800 font-semibold mb-1" />
                      <span className="text-[13px] font-semibold text-slate-800 ">{new Date(ob.alertDate).toLocaleDateString()}</span>
                      <span className="text-[12px] font-semibold text-slate-800 normal-case">Detection Date</span>
                   </div>
                </div>

                {ob.notifiedToDOH ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 ">
                     <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                     <span className="text-[12px] font-semibold text-emerald-600 normal-case tracking-normal">Notified to DOH Abu Dhabi</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100 animate-pulse">
                     <AlertCircle className="w-4 h-4 text-rose-600" />
                     <span className="text-[12px] font-semibold text-rose-600 normal-case tracking-normal">DOH Notification Pending</span>
                  </div>
                )}

                <button 
                  onClick={() => onSelect(ob._id)}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-[12px] font-semibold normal-case tracking-normal flex items-center justify-center gap-2 group-hover:bg-primary transition-all"
                >
                   Manage Investigation
                   <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
        
        {/* Log New Outbreak Card */}
        <button className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 group hover:border-[#040404] transition-all">
           <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-slate-800 font-semibold group-hover:text-slate-800" />
           </div>
           <span className="mt-6 text-[12px] font-semibold text-slate-800 normal-case tracking-normal group-hover:text-slate-800">Log New Outbreak</span>
        </button>
      </div>
    </div>
  );
};

export default OutbreakManager;
