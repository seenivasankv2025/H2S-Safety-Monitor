import React, { useEffect, useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const ManagerWorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/manager/workers/${encodeURIComponent(workerId)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
        });
        if (!response.ok) throw new Error('Unable to load worker history');
        setProfile(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workerId]);

  if (loading) return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading worker history...</div>;
  if (error) return <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-xs font-mono text-red-300">{error}</div>;

  const worker = profile.worker;
  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/manager/workers')} className="flex items-center gap-2 text-xs font-mono text-slate-400 transition hover:text-cyan-400">
        <ArrowLeft className="h-4 w-4" /> Back to Workers
      </button>
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">Worker Profile</p>
        <h2 className="mt-1 text-3xl font-extrabold text-white">{worker.name || worker.username}</h2>
        <p className="mt-1 text-sm font-mono text-slate-400">{worker.worker_id} · {worker.department}</p>
      </div>
      <section className="glass-panel rounded-3xl border border-cyan-500/20 p-6">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Worker Test History</h3>
        </div>
        {profile.history.length === 0 ? (
          <p className="mt-6 text-xs font-mono text-slate-500">No history records found.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 pb-3">TIMESTAMP</th>
                  <th className="px-3 pb-3">PHYSICAL STAGE</th>
                  <th className="px-3 pb-3">PPM</th>
                  <th className="px-3 pb-3">SAFETY LEVEL</th>
                  <th className="px-3 pb-3">INPUT TYPE</th>
                  <th className="px-3 pb-3">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profile.history.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-3 text-slate-300">{new Date(test.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-3 font-semibold text-white">{test.physical_color_stage || 'UNKNOWN'}</td>
                    <td className="px-3 py-3 text-amber-300">{test.ppm || 'N/A'}</td>
                    <td className="px-3 py-3 text-cyan-400">{test.safety_level || 'UNKNOWN'}</td>
                    <td className="px-3 py-3 text-slate-400">{test.input_type || 'TEST'}</td>
                    <td className="px-3 py-3 text-slate-300">{test.confidence ?? '-'}%</td>
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