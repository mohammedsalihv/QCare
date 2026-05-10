import React from 'react';
import { ShieldAlert, Users, Calendar, AlertCircle, CheckCircle2, ChevronRight, Bell } from 'lucide-react';

const OutbreakManager = ({ outbreaks, onSelect }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'suspected': return 'bg-amber-100 text-amber-600';
      case 'confirmed': return 'bg-rose-100 text-rose-600';
      case 'contained': return 'bg-blue-100 text-blue-600';
      case 'closed': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outbreaks?.map((ob) => (
          <div key={ob._id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
             <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(ob.status)}`}>
                   {ob.status}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ob.alertRef}</span>
             </div>
             
             <div className="p-8 space-y-6">
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{ob.infectionType} Outbreak</h3>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ob.affectedWard} Ward</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center">
                      <Users className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-lg font-black text-slate-900 dark:text-white">{ob.currentCaseCount}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Total Cases</span>
                   </div>
                   <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center">
                      <Calendar className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">{new Date(ob.alertDate).toLocaleDateString()}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Detection Date</span>
                   </div>
                </div>

                {ob.notifiedToDOH ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                     <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Notified to DOH Abu Dhabi</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800 animate-pulse">
                     <AlertCircle className="w-4 h-4 text-rose-600" />
                     <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">DOH Notification Pending</span>
                  </div>
                )}

                <button 
                  onClick={() => onSelect(ob._id)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-all"
                >
                   Manage Investigation
                   <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
        
        {/* Log New Outbreak Card */}
        <button className="bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 group hover:border-blue-500 transition-all">
           <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
           </div>
           <span className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-500">Log New Outbreak</span>
        </button>
      </div>
    </div>
  );
};

export default OutbreakManager;
