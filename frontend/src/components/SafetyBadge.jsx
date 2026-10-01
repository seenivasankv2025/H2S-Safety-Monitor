import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Flame } from 'lucide-react';

export const SafetyBadge = ({ level, size = 'md' }) => {
  const configs = {
    'VERY LOW': {
      bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 glow-cyan',
      icon: ShieldCheck,
      dot: 'bg-emerald-400'
    },
    'LOW': {
      bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      icon: ShieldCheck,
      dot: 'bg-emerald-300'
    },
    'MODERATE': {
      bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40 glow-amber',
      icon: AlertTriangle,
      dot: 'bg-amber-400 animate-pulse'
    },
    'RISK': {
      bg: 'bg-orange-950/80 text-orange-400 border-orange-500/50 glow-amber',
      icon: ShieldAlert,
      dot: 'bg-orange-500 animate-ping'
    },
    'HIGH RISK': {
      bg: 'bg-red-950/90 text-red-400 border-red-500/70 glow-red animate-pulse',
      icon: Flame,
      dot: 'bg-red-500 animate-ping'
    }
  };

  const config = configs[level] || {
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: ShieldCheck,
    dot: 'bg-slate-400'
  };

  const Icon = config.icon;
  const padding = size === 'lg' ? 'px-4 py-2 text-base font-bold' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border backdrop-blur-md ${config.bg} ${padding}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
      <span className="tracking-wider uppercase">{level}</span>
    </span>
  );
};
