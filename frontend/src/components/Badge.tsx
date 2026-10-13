import React from 'react';
import { TrustState, ThreatSeverity, OperatingMode } from '../types';

export const TrustBadge: React.FC<{ state: TrustState | string; score?: number }> = ({ state, score }) => {
  const s = String(state).toUpperCase();
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  if (s === 'TRUSTED') bg = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
  else if (s === 'MONITOR') bg = 'bg-amber-950/80 text-amber-400 border-amber-800/60';
  else if (s === 'RESTRICT') bg = 'bg-orange-950/80 text-orange-400 border-orange-800/60';
  else if (s === 'ISOLATE') bg = 'bg-rose-950/80 text-rose-400 border-rose-800/60';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s === 'TRUSTED' ? 'bg-emerald-400' : s === 'MONITOR' ? 'bg-amber-400' : s === 'RESTRICT' ? 'bg-orange-400' : 'bg-rose-400'}`} />
      {s} {score !== undefined && `(${score})`}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: ThreatSeverity | string }> = ({ severity }) => {
  const sev = String(severity).toUpperCase();
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  if (sev === 'CRITICAL') bg = 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse';
  else if (sev === 'HIGH') bg = 'bg-red-950/80 text-red-400 border-red-800/70';
  else if (sev === 'MEDIUM') bg = 'bg-amber-950/80 text-amber-400 border-amber-800/70';
  else if (sev === 'LOW') bg = 'bg-blue-950/80 text-blue-400 border-blue-800/70';
  else if (sev === 'INFO') bg = 'bg-slate-800/90 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${bg}`}>
      {sev}
    </span>
  );
};

export const ModeBadge: React.FC<{ mode: OperatingMode | string }> = ({ mode }) => {
  const m = String(mode).toUpperCase();
  let color = 'text-blue-400 border-blue-800 bg-blue-950/50';
  if (m === 'LIVE_CAPTURE') color = 'text-emerald-400 border-emerald-800 bg-emerald-950/50';
  else if (m === 'CONTROLLED_LAB') color = 'text-purple-400 border-purple-800 bg-purple-950/50';
  else if (m === 'OFFLINE_REPLAY') color = 'text-amber-400 border-amber-800 bg-amber-950/50';
  else if (m === 'SIMULATED_TEST') color = 'text-cyan-400 border-cyan-800 bg-cyan-950/50';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${color}`}>
      {m}
    </span>
  );
};
