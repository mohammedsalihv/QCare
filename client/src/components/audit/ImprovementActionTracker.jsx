import React from 'react';
import { Calendar, User, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';

const ImprovementActionTracker = ({ actions, onUpdateStatus }) => {
  const columns = [
    { id: 'open', label: 'Open Actions', color: 'bg-rose-500', icon: Circle },
    { id: 'in-progress', label: 'In Progress', color: 'bg-amber-500', icon: Clock },
    { id: 'completed', label: 'Resolved', color: 'bg-emerald-500', icon: CheckCircle2 }
  ];

  const getFilteredActions = (status) => actions?.filter(a => a.status === status) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {columns.map((col) => (
        <div key={col.id} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{col.label}</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              {getFilteredActions(col.id).length}
            </span>
          </div>

          <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
            {getFilteredActions(col.id).map((action, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 group transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex justify-between items-start">
                   <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                     action.priority === 'high' ? 'bg-rose-100 text-rose-600' :
                     action.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                   }`}>
                     {action.priority} Priority
                   </span>
                </div>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {action.actionText}
                </p>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      {action.owner?.employeeName || 'Assigned Staff'}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Due: {new Date(action.dueDate).toLocaleDateString()}
                   </div>
                </div>

                {col.id !== 'completed' && (
                  <button
                    onClick={() => onUpdateStatus(action._id, col.id === 'open' ? 'in-progress' : 'completed')}
                    className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 rounded-lg"
                  >
                    Move to {col.id === 'open' ? 'In Progress' : 'Resolved'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImprovementActionTracker;
