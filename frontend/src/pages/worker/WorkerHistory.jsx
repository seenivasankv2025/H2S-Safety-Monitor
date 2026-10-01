import React, { useEffect, useState } from 'react';
import { getWorkerHistoryApi } from '../../services/api';
import { SafetyBadge } from '../../components/SafetyBadge';
import { History, Search } from 'lucide-react';

export const WorkerHistory = () => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getWorkerHistoryApi();
        setHistory(res);
      } catch (err) {
        console.error("Failed to load worker history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = history.filter(item => 
    item.physical_color_stage?.toLowerCase().includes(search.toLowerCase()) ||
    item.safety_level?.toLowerCase().includes(search.toLowerCase()) ||
    item.input_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Personal Measurement History</h2>
          <p className="text-slate-400 text-xs font-mono">Historical audit log for your logged-in worker ID</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stage or safety level..."
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 w-64 font-mono"
          />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading history records...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 px-3">RECORD ID</th>
                  <th className="pb-3 px-3">TIMESTAMP</th>
                  <th className="pb-3 px-3">INPUT TYPE</th>
                  <th className="pb-3 px-3">PHYSICAL STAGE</th>
                  <th className="pb-3 px-3">PPM</th>
                  <th className="pb-3 px-3">SAFETY LEVEL</th>
                  <th className="pb-3 px-3">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{item.id}</td>
                    <td className="py-3 px-3 text-slate-300">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-400">{item.input_type}</td>
                    <td className="py-3 px-3 font-semibold text-white">{item.physical_color_stage}</td>
                    <td className="py-3 px-3 text-amber-300">{item.ppm || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <SafetyBadge level={item.safety_level} />
                    </td>
                    <td className="py-3 px-3 text-slate-300">{item.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No matching history records found.
          </div>
        )}
      </div>
    </div>
  );
};
