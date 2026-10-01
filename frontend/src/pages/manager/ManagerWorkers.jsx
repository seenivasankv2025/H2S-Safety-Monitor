import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/manager/workers/${encodeURIComponent(deleteTarget.worker_id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
      });
      if (!response.ok) throw new Error('Unable to remove worker');
      setWorkers((current) => current.filter((worker) => worker.worker_id !== deleteTarget.worker_id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/manager/workers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('h2s_access_token')}` }
        });
        if (!response.ok) throw new Error('Unable to load workers');
        setWorkers(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workers;
    return workers.filter((worker) =>
      [worker.name, worker.username, worker.worker_id, worker.department]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [search, workers]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading worker roster...</div>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Worker Details</h2>
          <p className="mt-1 text-sm font-mono text-slate-400">Registered personnel and current H₂S exposure status</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter workers by name or ID..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 py-3 pl-11 pr-4 text-xs font-mono text-white outline-none transition focus:border-cyan-500"
          />
        </label>
      </div>

      <div className="glass-panel rounded-3xl p-7">
        {error && <p className="mb-5 rounded-xl border border-red-800 bg-red-950/50 p-3 text-xs font-mono text-red-300">{error}</p>}
        {filteredWorkers.length === 0 ? (
          <p className="py-12 text-center text-sm font-mono text-slate-500">No workers match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredWorkers.map((worker) => (
              <article key={worker.worker_id} className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-6 transition hover:border-cyan-500/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-extrabold text-white">{worker.name || worker.username}</h3>
                      <span className="rounded border border-cyan-500/30 bg-slate-950/60 px-2 py-1 text-xs font-mono text-cyan-400">{worker.worker_id}</span>
                    </div>
                    <p className="mt-2 text-sm font-mono text-slate-400">{worker.department || 'Plant Operational Safety'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5" title="Worker active">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-slate-500">Latest Update:</p>
                    <p className="mt-1 text-xs font-mono text-slate-300">
                      {worker.latest_test ? `${worker.latest_test.safety_level || 'UNKNOWN'} · ${worker.latest_test.physical_color_stage || 'Unknown stage'} · ${worker.latest_test.ppm || 'N/A'}` : 'No tests recorded'}
                    </p>
                    <p className="mt-2 text-xs font-mono text-slate-500">Total Strip Tests: <span className="text-slate-300">{worker.total_tests || 0}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(`/manager/workers/${encodeURIComponent(worker.worker_id)}`)} className="flex items-center gap-1 text-sm font-mono text-slate-400 transition hover:text-cyan-400">
                      View Profile <ChevronRight className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(worker)} className="flex items-center gap-1 text-sm font-mono text-red-400 transition hover:text-red-300" aria-label={`Delete ${worker.name || worker.username}`}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Remove worker?</h3>
                <p className="mt-2 text-sm font-mono text-slate-400">Want to remove {deleteTarget.name || deleteTarget.username}?</p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cancel delete">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-mono text-slate-300 hover:bg-slate-800">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
