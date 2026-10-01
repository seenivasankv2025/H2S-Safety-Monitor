import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, EyeOff } from 'lucide-react';

export const ExpiryBadge = ({ status }) => {
  const configs = {
    'VALID': {
      bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'VALID STABILITY'
    },
    'WARNING': {
      bg: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
      icon: AlertTriangle,
      label: 'EXPIRING SOON'
    },
    'EXPIRED': {
      bg: 'bg-red-950/80 text-red-400 border-red-500/60',
      icon: XCircle,
      label: 'EXPIRED / INVALID'
    },
    'NOT_VISIBLE': {
      bg: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: EyeOff,
      label: 'PATCH NOT VISIBLE'
    }
  };

  const config = configs[status] || configs['NOT_VISIBLE'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-mono font-medium ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
