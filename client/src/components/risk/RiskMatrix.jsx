import React, { useState } from 'react';
import { X } from 'lucide-react';

const RiskMatrix = ({ matrixData, onSelectRisk }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  const getCellColor = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score >= 15) return 'bg-rose-500 hover:bg-rose-600 text-white';
    if (score >= 10) return 'bg-orange-500 hover:bg-orange-600 text-white';
    if (score >= 5) return 'bg-amber-500 hover:bg-amber-600 text-white';
    return 'bg-emerald-500 hover:bg-emerald-600 text-white';
  };

  const getCellData = (likelihood, impact) => {
    if (!Array.isArray(matrixData)) return null;
    return matrixData.find(m => m.likelihood === likelihood && m.impact === impact);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 5x5 Heatmap */}
      <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative">
        <div className="absolute left-4 top-1/2 -rotate-90 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Likelihood →</div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Impact →</div>
        
        <div className="grid grid-cols-5 gap-2 h-[450px]">
          {[5, 4, 3, 2, 1].map(l => (
            [1, 2, 3, 4, 5].map(i => {
              const cellData = getCellData(l, i);
              const count = cellData?.risks?.length || 0;
              return (
                <button
                  key={`${l}-${i}`}
                  onClick={() => setSelectedCell(cellData)}
                  className={`relative flex items-center justify-center rounded-xl transition-all active:scale-95 group ${getCellColor(l, i)}`}
                >
                  <span className="text-xl font-black">{count}</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </button>
              );
            })
          ))}
        </div>
      </div>

      {/* Side Drawer for Selected Cell */}
      <div className={`w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden transition-all ${selectedCell ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none hidden'}`}>
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
           <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Risks in Segment</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                L: {selectedCell?.likelihood} × I: {selectedCell?.impact} = {selectedCell?.likelihood * selectedCell?.impact}
              </p>
           </div>
           <button onClick={() => setSelectedCell(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
              <X className="w-4 h-4" />
           </button>
        </div>
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
           {selectedCell?.risks?.map((risk, idx) => (
              <div 
                key={idx} 
                onClick={() => onSelectRisk(risk._id)}
                className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-200 transition-all group"
              >
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{risk.riskId}</span>
                 <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-2">{risk.title}</p>
                 <div className="mt-3 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      risk.level === 'critical' ? 'bg-rose-100 text-rose-600' :
                      risk.level === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {risk.level}
                    </span>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;
