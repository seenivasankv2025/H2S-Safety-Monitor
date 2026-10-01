import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { LogOut, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">H₂S Safety Monitor</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">H2S sensing strip AI vision platform</p>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* User Info & Role Badge */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <span className="text-[10px] font-mono text-slate-400">ID: {user.worker_id}</span>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
