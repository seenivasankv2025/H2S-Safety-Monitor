import React, { useEffect, useState } from 'react';
import { AlertTriangle, Flame, ShieldAlert } from 'lucide-react';

export const ManagerAlerts = () => {
  const [riskWorkers, setRiskWorkers] = useState([]);
  const [highRiskWorkers, setHighRiskWorkers] = useState([]);
  const [dangerWorkers, setDangerWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/manager/alerts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
        });
        if (!response.ok) throw new Error('Unable to load worker risk alerts');
        const json = await response.json();
        setRiskWorkers(json.risk_workers || []);
        setHighRiskWorkers(json.high_risk_workers || []);
        setDangerWorkers(json.danger_workers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderWorkers = (workers, highRisk) => (
    workers.length === 0 ? (
      <p className="py-8 text-center text-xs font-mono text-slate-500">No workers in this category.</p>
    ) : (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {workers.map((worker) => (
          <div key={worker.worker_id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-white">{worker.name}</p>
                <p className="mt-1 text-xs font-mono text-cyan-400">{worker.worker_id}</p>
                <p className="mt-2 text-xs font-mono text-slate-400">{worker.department}</p>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[10px] font-mono font-bold ${highRisk ? 'border-red-500/40 text-red-300' : 'border-amber-500/40 text-amber-300'}`}>
                {worker.safety_level}
              </span>
            </div>
            <p className="mt-3 text-xs font-mono text-slate-500">
              Latest strip: {worker.physical_color_stage} · {worker.timestamp ? new Date(worker.timestamp).toLocaleString() : 'Unknown time'}
            </p>
          </div>
        ))}
      </div>
    )
  );

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading worker risk alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Worker Risk Alerts</h2>
        <p className="mt-1 text-xs font-mono text-slate-400">Workers are grouped by the risk level of their latest strip test.</p>
      </div>
      {error && <p className="rounded-xl border border-red-800 bg-red-950/50 p-3 text-xs font-mono text-red-300">{error}</p>}
      <section className="glass-panel rounded-3xl border border-amber-500/20 p-6">
        <div className="mb-5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-amber-300">Risk Workers ({riskWorkers.length})</h3>
        </div>
        {renderWorkers(riskWorkers, false)}
      </section>
      <section className="glass-panel rounded-3xl border border-red-500/20 p-6">
        <div className="mb-5 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-bold text-red-300">High Risk Workers ({highRiskWorkers.length})</h3>
        </div>
        {renderWorkers(highRiskWorkers, true)}
      </section>
      <section className="glass-panel rounded-3xl border border-red-700/30 p-6">
        <div className="mb-5 flex items-center gap-3">
          <Flame className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-bold text-red-400">Danger Workers ({dangerWorkers.length})</h3>
        </div>
        {renderWorkers(dangerWorkers, true)}
      </section>
    </div>
  );
};
