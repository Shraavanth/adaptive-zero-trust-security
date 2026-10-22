import React from 'react';
import { TrustState, ThreatSeverity, OperatingMode } from '../types';

// Flags, not pills: tight radius, mono caps, a tinted hairline instead of a border.
const flag =
  'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[6px] font-mono text-[10px] font-medium tracking-[0.08em] whitespace-nowrap';

const TONES = {
  signal: 'bg-signal-400/10 text-signal-300 shadow-[inset_0_0_0_1px_rgb(194_234_110/0.22)]',
  amber: 'bg-amber-400/10 text-amber-300 shadow-[inset_0_0_0_1px_rgb(235_183_95/0.25)]',
  ember: 'bg-orange-400/10 text-orange-300 shadow-[inset_0_0_0_1px_rgb(232_147_93/0.25)]',
  coral: 'bg-rose-400/[0.12] text-rose-200 shadow-[inset_0_0_0_1px_rgb(242_122_110/0.35)]',
  ice: 'bg-white/[0.04] text-ice-300 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]',
} as const;

const DOT = {
  signal: 'bg-signal-400',
  amber: 'bg-amber-400',
  ember: 'bg-orange-400',
  coral: 'bg-rose-400',
  ice: 'bg-ice-400',
} as const;

const trustTone = (s: string): keyof typeof TONES =>
  s === 'TRUSTED' ? 'signal' : s === 'MONITOR' ? 'amber' : s === 'RESTRICT' ? 'ember' : s === 'ISOLATE' ? 'coral' : 'ice';

export const TrustBadge: React.FC<{ state: TrustState | string; score?: number }> = ({ state, score }) => {
  const s = String(state).toUpperCase();
  const tone = trustTone(s);
  return (
    <span className={`${flag} ${TONES[tone]}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT[tone]} ${s === 'ISOLATE' ? 'live-ping text-rose-400' : ''}`} />
      {s}
      {score !== undefined && <span className="opacity-60">{score}</span>}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: ThreatSeverity | string }> = ({ severity }) => {
  const sev = String(severity).toUpperCase();
  const tone: keyof typeof TONES =
    sev === 'CRITICAL' || sev === 'HIGH' ? 'coral' : sev === 'MEDIUM' ? 'amber' : 'ice';
  return (
    <span className={`${flag} ${TONES[tone]}`}>
      {sev === 'CRITICAL' && <span aria-hidden="true" className="live-ping h-1.5 w-1.5 rounded-full bg-rose-400 text-rose-400" />}
      {sev}
    </span>
  );
};

export const ModeBadge: React.FC<{ mode: OperatingMode | string }> = ({ mode }) => {
  const m = String(mode).toUpperCase();
  const tone: keyof typeof TONES = m === 'LIVE_CAPTURE' ? 'signal' : m === 'OFFLINE_REPLAY' ? 'amber' : 'ice';
  return <span className={`${flag} ${TONES[tone]}`}>{m.replace('_', ' ')}</span>;
};
