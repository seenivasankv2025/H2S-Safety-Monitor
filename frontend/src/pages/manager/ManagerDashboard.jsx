import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Users, Activity, ShieldCheck, Flame } from 'lucide-react';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/manager/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
        });
        if (!response.ok) throw new Error('Unable to load dashboard');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading manager dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl">
        <h2 className="text-2xl font-extrabold text-white">Welcome back, {user?.name}</h2>
        <p className="text-slate-400 text-xs font-mono mt-1">Operations overview for the H₂S safety monitoring network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <p className="text-xs font-mono text-slate-400 uppercase">Workers</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-white">{data?.total_workers || 0}</span>
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <p className="text-xs font-mono text-slate-400 uppercase">Total Tests</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-white">{data?.total_measurements || 0}</span>
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
        </div>

      </div>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <Flame className="h-5 w-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Test Classification</h3>
            <p className="mt-1 text-xs font-mono text-slate-400">Recorded results by sensing strip color</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['VERY LOW', 'White', 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'],
            ['LOW', 'Pale Yellow', 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'],
            ['MODERATE', 'Distinct Yellow', 'bg-yellow-950/80 border-yellow-500/70 text-yellow-300'],
            ['RISK', 'Brown', 'bg-[#6b442d] border-[#b88762] text-[#f1c5a0]'],
            ['HIGH RISK', 'Dark Brown', 'bg-[#40251b] border-[#8f5235] text-[#e5a789]'],
            ['DANGER', 'Black', 'bg-[#2b1814] border-[#71311f] text-[#e58b6e]']
          ].map(([label, color, style]) => (
            <div key={label} className={`flex items-center justify-between rounded-full border px-5 py-3 ${style}`}>
              <div>
                <p className="text-xs font-mono font-bold uppercase">{label}</p>
                <p className="mt-1 text-[10px] font-mono opacity-80">{color}</p>
              </div>
              <p className="text-2xl font-extrabold text-white">{data?.classification_counts?.[label] || 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white">All Recorded Tests</h3>
        <p className="mt-1 text-xs font-mono text-slate-400">Complete test history across the monitoring network</p>
        {(data?.all_recorded_tests || []).length === 0 ? (
          <p className="mt-6 text-center text-xs font-mono text-slate-500">No tests recorded.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="px-3 pb-3">DATE</th>
                  <th className="px-3 pb-3">WORKER</th>
                  <th className="px-3 pb-3">STAGE</th>
                  <th className="px-3 pb-3">PPM</th>
                  <th className="px-3 pb-3">SAFETY LEVEL</th>
                  <th className="px-3 pb-3">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.all_recorded_tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-3 text-slate-300">{new Date(test.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-3 text-cyan-400">{test.worker_name || test.worker_id || '-'}</td>
                    <td className="px-3 py-3 font-semibold text-white">{test.physical_color_stage || '-'}</td>
                    <td className="px-3 py-3 text-amber-300">{test.ppm || 'N/A'}</td>
                    <td className="px-3 py-3 text-slate-300">{test.safety_level || '-'}</td>
                    <td className="px-3 py-3 text-slate-400">{test.confidence ?? '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
