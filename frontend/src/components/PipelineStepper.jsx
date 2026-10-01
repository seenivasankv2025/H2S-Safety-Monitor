import React from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';

export const PipelineStepper = ({ steps = [], rejectionReason }) => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <span>15-Step Computer Vision Execution Pipeline</span>
        </h4>
        {rejectionReason ? (
          <span className="px-2.5 py-1 rounded bg-red-950/80 text-red-400 border border-red-800 text-xs font-mono font-bold">
            FAILED: {rejectionReason}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
            ALL CHECKS PASSED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition ${
              s.passed 
                ? 'bg-slate-900/60 border-slate-800/90 text-slate-300' 
                : 'bg-red-950/40 border-red-900/60 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {s.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div className="truncate">
                <span className="font-semibold text-white mr-1.5">{s.name}</span>
                {s.detail && <p className="text-[10px] text-slate-400 truncate">{s.detail}</p>}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-bold ml-2">#{s.step || idx+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
