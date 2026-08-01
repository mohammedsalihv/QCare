import React, { useState } from 'react';
import { X, User, Calendar, MessageSquare, ShieldAlert, CheckCircle2, Plus, Clock } from 'lucide-react';

const ComplaintDetailDrawer = ({ complaint, isOpen, onClose, onAcknowledge, onResolve, onEscalate, onAddAction }) => {
  const [actionNote, setActionNote] = useState('');

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col h-full">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-[#040404] rounded-2xl">
                 <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-black font-bold dark:text-white uppercase tracking-tight">{complaint.complaintRef}</h3>
                 <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">{complaint.category} • {complaint.severity} severity</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <X className="w-6 h-6 text-black font-bold" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10">
           {/* Summary Section */}
           <section className="space-y-4">
              <h4 className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Complaint Details</h4>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-sm font-bold text-black font-bold dark:text-black font-bold leading-relaxed">{complaint.description}</p>
                 <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-black font-bold uppercase">
                       <User className="w-4 h-4" /> {complaint.patientName} (MRN: {complaint.patientMRN})
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-black font-bold uppercase">
                       <Calendar className="w-4 h-4" /> Received: {new Date(complaint.dateReceived).toLocaleDateString()}
                    </div>
                 </div>
              </div>
           </section>

           {/* Actions Timeline */}
           <section className="space-y-6">
              <h4 className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Investigation Timeline</h4>
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                 {complaint.actionsTaken?.map((action, idx) => (
                   <div key={idx} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-7 h-7 bg-white dark:bg-white rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                         <div className="w-2 h-2 rounded-full bg-[#040404]" />
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-800/30 rounded-2xl border border-slate-50 dark:border-slate-800">
                         <p className="text-xs font-bold text-black font-bold dark:text-black font-bold">{action.action}</p>
                         <p className="text-[9px] font-black text-black font-bold uppercase tracking-widest mt-1">
                            {action.takenBy?.employeeName} • {new Date(action.takenAt).toLocaleString()}
                         </p>
                      </div>
                   </div>
                 ))}
                 
                 {/* Add Action Form */}
                 <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-7 h-7 bg-slate-100 rounded-full border-2 border-blue-100 flex items-center justify-center">
                       <Plus className="w-4 h-4 text-[#040404]" />
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={actionNote}
                         onChange={(e) => setActionNote(e.target.value)}
                         placeholder="Log investigation action..."
                         className="flex-1 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-[#040404]"
                       />
                       <button 
                         onClick={() => { onAddAction(actionNote); setActionNote(''); }}
                         className="px-4 py-2 bg-[#040404] text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                       >
                         Post
                       </button>
                    </div>
                 </div>
              </div>
           </section>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
           <div className="flex gap-3">
              {complaint.status === 'open' && (
                <button 
                  onClick={onAcknowledge}
                  className="flex-1 py-4 bg-[#040404] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#040404]/20 hover:bg-[#040404] transition-all"
                >
                  Acknowledge
                </button>
              )}
              {['acknowledged', 'investigating'].includes(complaint.status) && (
                <button 
                  onClick={onResolve}
                  className="flex-1 py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                >
                  Mark Resolved
                </button>
              )}
              {!complaint.escalatedToDOH && (
                <button 
                  onClick={onEscalate}
                  className="px-8 py-4 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-200 transition-all"
                >
                  Escalate to DOH
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailDrawer;
