import React, { useEffect, useState } from 'react';
import { getWorkerDashboardApi } from '../../services/api';
import { SafetyBadge } from '../../components/SafetyBadge';
import { Camera, Upload, History, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const res = await getWorkerDashboardApi();
        setData(res);
      } catch (err) {
        console.error("Failed to load worker dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDash();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading Worker Dashboard...</div>;
  }

  const latest = data?.latest_measurement;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white">Welcome back, {data?.worker_info?.name}</h2>
            <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
              {data?.worker_info?.worker_id}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-mono">{data?.worker_info?.department} • H2S sensing strip testing station</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/worker/live"
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Live Camera</span>
          </Link>
          <Link
            to="/worker/upload"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 rounded-2xl space-y-2 border-l-4 border-l-cyan-500">
          <p className="text-xs font-mono text-slate-400 uppercase">Total Tests Conducted</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{data?.total_tests || 0}</span>
            <Activity className="w-6 h-6 text-cyan-400 opacity-60" />
          </div>
          <p className="text-[11px] text-slate-500">Logged in worker history</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2 border-l-4 border-l-emerald-500">
          <p className="text-xs font-mono text-slate-400 uppercase">Latest Safety Level</p>
          {latest ? (
            <div className="pt-1">
              <SafetyBadge level={latest.safety_level} size="lg" />
            </div>
          ) : (
            <span className="text-sm text-slate-400 font-mono">No Tests Yet</span>
          )}
        </div>
      </div>

      {/* Latest Measurement Detailed Card */}
      {latest && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Most Recent Test Result</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {new Date(latest.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px]">PHYSICAL COLOR STAGE</span>
              <p className="text-sm font-bold text-cyan-300">{latest.physical_color_stage}</p>
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px]">ESTIMATED H₂S CONCENTRATION</span>
              <p className="text-sm font-bold text-amber-300">{latest.ppm || 'N/A'}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px]">ANALYSIS CONFIDENCE</span>
              <p className="text-sm font-bold text-emerald-400">{latest.confidence}%</p>
            </div>

          </div>
        </div>
      )}

      {/* Recent History Table Preview */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Recent Tests</h3>
          <Link to="/worker/history" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 px-3">TIMESTAMP</th>
                <th className="pb-3 px-3">INPUT TYPE</th>
                <th className="pb-3 px-3">PHYSICAL STAGE</th>
                <th className="pb-3 px-3">SAFETY RESULT</th>
                <th className="pb-3 px-3">CONFIDENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recent_history?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 text-slate-300">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 text-slate-400">{m.input_type}</td>
                  <td className="py-3 px-3 font-semibold text-cyan-300">{m.physical_color_stage}</td>
                  <td className="py-3 px-3">
                    <SafetyBadge level={m.safety_level} />
                  </td>
                  <td className="py-3 px-3 text-slate-300">{m.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
