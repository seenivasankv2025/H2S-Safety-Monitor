import React, { useEffect, useState } from 'react';
import { Activity, Users, AlertTriangle, Flame, ShieldCheck } from 'lucide-react';

export const ManagerReports = () => {
  const [data, setData] = useState(null);
  const [selectedClassification, setSelectedClassification] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/manager/reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
      });
      const json = await response.json();
      setData(json);
    };
    load();
  }, []);

  const classifications = [
    ['VERY LOW', 'White', 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300', ShieldCheck],
    ['LOW', 'Pale Yellow', 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300', ShieldCheck],
    ['MODERATE', 'Distinct Yellow', 'bg-yellow-950/80 border-yellow-500/70 text-yellow-300', AlertTriangle],
    ['RISK', 'Brown', 'bg-[#6b442d] border-[#b88762] text-[#f1c5a0]', AlertTriangle],
    ['HIGH RISK', 'Dark Brown', 'bg-[#40251b] border-[#8f5235] text-[#e5a789]', Flame],
    ['DANGER', 'Black', 'bg-[#2b1814] border-[#71311f] text-[#e58b6e]', Flame]
  ];
  const visibleTests = selectedClassification
    ? (data?.classification_tests?.[selectedClassification] || [])
    : (data?.measurements || []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-white">Reports</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="glass-card rounded-2xl border-l-4 border-l-cyan-500 p-6">
          <p className="text-xs font-mono uppercase text-slate-400">Total Tests</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-4xl font-extrabold text-white">{data?.summary?.total_tests || 0}</span>
            <Activity className="h-7 w-7 text-cyan-400" />
          </div>
        </div>
        <div className="glass-card rounded-2xl border-l-4 border-l-emerald-500 p-6">
          <p className="text-xs font-mono uppercase text-slate-400">Number of Workers</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-4xl font-extrabold text-white">{data?.summary?.total_workers || 0}</span>
            <Users className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
      </div>
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white">Test Classification</h3>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classifications.map(([label, color, style, Icon]) => (
            <button type="button" key={label} onClick={() => setSelectedClassification(selectedClassification === label ? null : label)} className={`flex w-full items-center gap-3 rounded-full border px-5 py-3 text-left shadow-lg transition hover:brightness-110 ${style} ${selectedClassification === label ? 'ring-2 ring-white/60' : ''}`}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-mono font-bold uppercase">{label}</span>
                <span className="block text-[10px] font-mono opacity-80">{color}</span>
              </span>
              <span className="text-xl font-extrabold text-white">{data?.summary?.classification_counts?.[label] || 0}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <h4 className="text-sm font-bold text-white">{selectedClassification ? `${selectedClassification} Tests` : 'All Recorded Tests'} ({visibleTests.length})</h4>
          {visibleTests.length === 0 ? (
            <p className="mt-4 text-xs font-mono text-slate-500">No tests recorded.</p>
          ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead><tr className="border-b border-slate-800 text-slate-500"><th className="px-3 pb-2">DATE</th><th className="px-3 pb-2">WORKER</th><th className="px-3 pb-2">STAGE</th><th className="px-3 pb-2">PPM</th><th className="px-3 pb-2">SAFETY</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {visibleTests.map((test) => (
                      <tr key={test.id}><td className="px-3 py-3 text-slate-300">{new Date(test.timestamp).toLocaleString()}</td><td className="px-3 py-3 text-cyan-400">{test.worker_name || test.worker_id || '-'}</td><td className="px-3 py-3 text-white">{test.physical_color_stage || '-'}</td><td className="px-3 py-3 text-amber-300">{test.ppm || 'N/A'}</td><td className="px-3 py-3 text-slate-300">{test.safety_level || selectedClassification}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
