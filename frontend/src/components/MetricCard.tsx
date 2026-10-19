import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  statusColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  statusColor = 'blue'
}) => {
  const borderMap = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50',
    amber: 'border-amber-500/30 hover:border-amber-500/50',
    rose: 'border-rose-500/30 hover:border-rose-500/50',
    blue: 'border-blue-500/30 hover:border-blue-500/50',
    purple: 'border-purple-500/30 hover:border-purple-500/50',
    slate: 'border-slate-800 hover:border-slate-700'
  };

  const iconBgMap = {
    emerald: 'bg-emerald-950/60 text-emerald-400',
    amber: 'bg-amber-950/60 text-amber-400',
    rose: 'bg-rose-950/60 text-rose-400',
    blue: 'bg-blue-950/60 text-blue-400',
    purple: 'bg-purple-950/60 text-purple-400',
    slate: 'bg-slate-900 text-slate-400'
  };

  return (
    <div className={`rounded-xl bg-soc-card/95 border ${borderMap[statusColor]} p-4 shadow-lg shadow-black/10 transition-colors duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-soc-muted">{title}</span>
        <div className={`rounded-lg p-2 ${iconBgMap[statusColor]}`} aria-hidden="true">{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-soc-text sm:text-3xl">{value}</span>
        {trend && <span className="text-xs font-mono text-soc-dim">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 truncate text-xs text-soc-dim">{subtitle}</p>}
    </div>
  );
};
