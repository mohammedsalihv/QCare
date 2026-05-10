import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Save, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const AuditConductor = ({ audit, onSaveFindings, onFinalize }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [findings, setFindings] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (audit?.findings?.length > 0) {
      setFindings(audit.findings);
    } else if (audit?.templateId?.criteria) {
      setFindings(audit.templateId.criteria.map(c => ({
        criterionId: c.criterionId,
        complianceStatus: 'non-compliant',
        evidence: '',
        attachments: []
      })));
    }
  }, [audit]);

  const updateFinding = (status, evidence) => {
    const newFindings = [...findings];
    newFindings[currentStep] = {
      ...newFindings[currentStep],
      complianceStatus: status,
      evidence: evidence
    };
    setFindings(newFindings);
  };

  const calculateScore = () => {
    if (!findings.length) return 0;
    let total = 0;
    findings.forEach(f => {
      if (f.complianceStatus === 'compliant') total += 100;
      else if (f.complianceStatus === 'partial') total += 50;
    });
    return (total / findings.length).toFixed(1);
  };

  const currentCriterion = audit?.templateId?.criteria[currentStep];
  const currentFinding = findings[currentStep] || {};

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Progress Header */}
      <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-end mb-6">
            <div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{audit?.auditTitle}</h3>
               <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{audit?.governancePillar?.replace('-', ' ')}</p>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Running Score</span>
               <p className="text-3xl font-black text-slate-900 dark:text-white">{calculateScore()}%</p>
            </div>
         </div>
         
         <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
            {audit?.templateId?.criteria.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-full border-r border-white/20 transition-all ${
                  idx === currentStep ? 'bg-blue-600 w-full' : 
                  idx < currentStep ? 'bg-emerald-500 w-full' : 'w-full'
                }`}
              />
            ))}
         </div>
         <div className="flex justify-between mt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Criterion {currentStep + 1} of {audit?.templateId?.criteria.length}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase">{Math.round(((currentStep + 1) / audit?.templateId?.criteria.length) * 100)}% Complete</span>
         </div>
      </div>

      {/* Main Form */}
      <div className="p-10 space-y-10">
         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Standard & Criterion</h4>
            <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
               <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentCriterion?.text}
               </p>
               {currentCriterion?.text_ar && (
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-4 text-right font-arabic" dir="rtl">
                    {currentCriterion?.text_ar}
                  </p>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Status</h4>
               <div className="grid grid-cols-1 gap-3">
                  {['compliant', 'partial', 'non-compliant'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateFinding(status, currentFinding.evidence)}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                        currentFinding.complianceStatus === status 
                        ? (status === 'compliant' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 
                           status === 'partial' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-rose-500 bg-rose-50 text-rose-700')
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-sm font-black uppercase tracking-widest">{status.replace('-', ' ')}</span>
                      {currentFinding.complianceStatus === status && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence & Findings</h4>
               <textarea
                 value={currentFinding.evidence || ''}
                 onChange={(e) => updateFinding(currentFinding.complianceStatus, e.target.value)}
                 className="w-full h-44 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 outline-none focus:border-blue-500 transition-all text-sm font-medium resize-none"
                 placeholder="Enter detailed evidence observed, documents reviewed, or staff interviewed..."
               />
            </div>
         </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
         <button
           disabled={currentStep === 0}
           onClick={() => setCurrentStep(prev => prev - 1)}
           className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-500 hover:text-slate-900 disabled:opacity-30 font-black uppercase text-[10px] tracking-widest transition-all"
         >
           <ChevronLeft className="w-4 h-4" />
           Previous
         </button>

         <div className="flex gap-4">
            <button
              onClick={() => onSaveFindings(findings)}
              className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Progress
            </button>
            
            {currentStep < audit?.templateId?.criteria.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Next Criterion
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onFinalize(findings)}
                className="flex items-center gap-2 px-10 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none"
              >
                Finalize Audit
                <Check className="w-4 h-4" />
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default AuditConductor;
