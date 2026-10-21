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
      <div className="flex-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative">
        <div className="absolute left-4 top-1/2 -rotate-90 text-[12px] font-semibold text-slate-800 normal-case tracking-[0.4em]">Likelihood →</div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[12px] font-semibold text-slate-800 normal-case tracking-[0.4em]">Impact →</div>
        
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
                  <span className="text-xl font-semibold">{count}</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </button>
              );
            })
          ))}
        </div>
      </div>

      {/* Side Drawer for Selected Cell */}
      <div className={`w-full lg:w-96 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden transition-all ${selectedCell ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none hidden'}`}>
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 ">
           <div>
              <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Risks in Segment</h4>
              <p className="text-[12px] text-slate-800 font-semibold normal-case mt-1">
                L: {selectedCell?.likelihood} × I: {selectedCell?.impact} = {selectedCell?.likelihood * selectedCell?.impact}
              </p>
           </div>
           <button onClick={() => setSelectedCell(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
              <X className="w-4 h-4" />
           </button>
        </div>
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
           {selectedCell?.risks?.map((risk, idx) => (
              <div 
                key={idx} 
                onClick={() => onSelectRisk(risk._id)}
                className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 cursor-pointer hover:border-blue-200 transition-all group"
              >
                 <span className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal">{risk.riskId}</span>
                 <p className="text-sm font-semibold text-slate-800 mt-1 line-clamp-2">{risk.title}</p>
                 <div className="mt-3 flex justify-between items-center">
                    <span className={`text-[12px] font-semibold normal-case px-2 py-0.5 rounded ${
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
