import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Camera,
  Upload,
  History,
  Users,
  Bell,
  FileText,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isManager = user.role?.toUpperCase() === 'MANAGER';

  const workerLinks = [
    { to: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/worker/live', label: 'Live Camera', icon: Camera },
    { to: '/worker/upload', label: 'Analyze Upload', icon: Upload },
    { to: '/worker/history', label: 'My Test History', icon: History },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard },
    { to: '/manager/workers', label: 'Workers', icon: Users },
    { to: '/manager/alerts', label: 'Alerts', icon: Bell },
    { to: '/manager/reports', label: 'Reports', icon: FileText },
  ];

  const links = isManager ? managerLinks : workerLinks;

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
            {isManager ? 'Management Console' : 'Worker Safety Station'}
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
