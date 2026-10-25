import UserSelect from '../UserSelect';
import Select from '../Select.jsx';
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save, Calculator } from 'lucide-react';

const RiskForm = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    riskTitle: '',
    riskCategory: 'clinical',
    description: '',
    department: '',
    likelihood: 3,
    impact: 3,
    owner: '',
    mitigationPlan: '',
    status: 'open'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const score = formData.likelihood * formData.impact;
  const getLevel = (s) => {
    if (s >= 15) return { label: 'CRITICAL', color: 'bg-rose-500', text: 'text-rose-500' };
    if (s >= 10) return { label: 'HIGH', color: 'bg-orange-500', text: 'text-orange-500' };
    if (s >= 5) return { label: 'MEDIUM', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'LOW', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const level = getLevel(score);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 ">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${level.color} text-white shadow-lg`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">Identify New Risk</h3>
              <p className="text-[12px] text-slate-800 font-semibold normal-case tracking-normal">Risk Assessment & Safety Planning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X className="w-6 h-6 text-slate-800 font-semibold" />
          </button>
        </div>

        {/* Body */}
        <form className="p-10 overflow-y-auto space-y-8" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal ml-1">Risk Title</label>
                <input 
                  type="text" required
                  value={formData.riskTitle}
                  onChange={(e) => setFormData({...formData, riskTitle: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#040404] transition-all font-semibold text-slate-800 "
                  placeholder="Summarize the identified risk..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal ml-1">Description</label>
                <textarea 
                  required rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#040404] transition-all font-semibold text-slate-800 resize-none"
                  placeholder="Detail the circumstances, triggers, and potential consequences..."
                />
              </div>
            </div>

            {/* Assessment Panel */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-8">
               <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Initial Assessment</h4>
                  <Calculator className="w-4 h-4 text-slate-800" />
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex justify-between">
                        <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Likelihood</label>
                        <span className="text-[13px] font-semibold text-slate-800">{formData.likelihood} / 5</span>
                     </div>
                     <input 
                       type="range" min="1" max="5" step="1"
                       value={formData.likelihood}
                       onChange={(e) => setFormData({...formData, likelihood: parseInt(e.target.value)})}
                       className="w-full accent-blue-600"
                     />
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between">
                        <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Impact</label>
                        <span className="text-[13px] font-semibold text-slate-800">{formData.impact} / 5</span>
                     </div>
                     <input 
                       type="range" min="1" max="5" step="1"
                       value={formData.impact}
                       onChange={(e) => setFormData({...formData, impact: parseInt(e.target.value)})}
                       className="w-full accent-blue-600"
                     />
                  </div>

                  <div className={`mt-8 p-6 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${level.color.replace('bg-', 'border-')} bg-white `}>
                     <span className={`text-4xl font-semibold ${level.text}`}>{score}</span>
                     <span className={`text-[12px] font-semibold normal-case tracking-normal mt-1 ${level.text}`}>{level.label} RISK</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 ">
             <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal ml-1">Risk Category</label>
                <Select 
                  value={formData.riskCategory}
                  onChange={(e) => setFormData({...formData, riskCategory: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#040404] transition-all font-semibold text-slate-800 appearance-none"
                >
                  <option value="clinical">Clinical</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="compliance">Compliance</option>
                  <option value="reputational">Reputational</option>
                  <option value="information-security">Information Security</option>
                  <option value="infrastructure">Infrastructure</option>
                </Select>
             </div>
             <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal ml-1">Department</label>
                <input 
                  type="text" required
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#040404] transition-all font-semibold text-slate-800 "
                  placeholder="e.g., Nursing, Radiology..."
                />
             </div>
          </div>

          <label className="block text-sm font-semibold">Risk owner
            <UserSelect aria-label="Risk owner" value={formData.owner} selectedLabel={initialData?.owner?.employeeName} onChange={event => setFormData({ ...formData, owner: event.target.value })} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
          </label>
          <div className="flex gap-4 pt-10">
             <button 
               type="button" onClick={onClose}
               className="flex-1 py-4 px-6 border-2 border-slate-100 text-slate-800 font-semibold normal-case text-[12px] tracking-normal rounded-2xl hover:bg-slate-50 transition-all"
             >
               Cancel
             </button>
             <button 
               type="submit"
               className="flex-[2] py-4 px-6 bg-primary text-white font-semibold normal-case text-[12px] tracking-normal rounded-2xl shadow-xl shadow-slate-200 hover:bg-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2"
             >
               <Save className="w-4 h-4" />
               Log & Register Risk
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskForm;
