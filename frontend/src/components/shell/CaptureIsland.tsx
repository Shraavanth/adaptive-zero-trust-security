import React from 'react';
import { ArrowUpRight, Square } from 'lucide-react';
import { OperatingMode } from '../../types';
import { AnimatedNumber } from '../AnimatedNumber';
import { Sparkline } from '../Sparkline';

interface CaptureIslandProps {
  isCapturing: boolean;
  isConnected: boolean;
  currentMode: OperatingMode;
  selectedInterface: string;
  packetRate: number;
  rateHistory: number[];
  onChangeMode: (mode: OperatingMode) => void;
  onToggleCapture: () => void;
}

const MODES: OperatingMode[] = ['SIMULATED_TEST', 'LIVE_CAPTURE', 'CONTROLLED_LAB', 'OFFLINE_REPLAY'];

export const CaptureIsland: React.FC<CaptureIslandProps> = ({
  isCapturing,
  isConnected,
  currentMode,
  selectedInterface,
  packetRate,
  rateHistory,
  onChangeMode,
  onToggleCapture,
}) => (
  <div className="glass flex items-center gap-1 rounded-full p-1.5">
    {/* Stream state + throughput */}
    <div
      className="hidden items-center gap-3 rounded-full py-1 pl-3 pr-2 md:flex"
      role="status"
      aria-label={`Capture ${isCapturing ? 'running' : 'idle'}, event stream ${isConnected ? 'connected' : 'disconnected'}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          isCapturing ? 'live-ping bg-signal-400 text-signal-400' : isConnected ? 'bg-ice-500' : 'bg-rose-400'
        }`}
      />
      <Sparkline className="hidden xl:block" values={rateHistory} width={64} height={22} color={isCapturing ? 'rgb(194 234 110)' : 'rgb(125 146 169)'} />
      <span className="min-w-[64px] whitespace-nowrap font-mono text-[12px] text-soc-text">
        <AnimatedNumber value={packetRate} duration={400} />
        <span className="ml-1 text-soc-dim">pkt/s</span>
      </span>
    </div>

    <span aria-hidden="true" className="hidden h-5 w-px bg-white/10 md:block" />

    <label className="relative hidden sm:block">
      <span className="sr-only">Operating mode</span>
      <select
        value={currentMode}
        onChange={(e) => onChangeMode(e.target.value as OperatingMode)}
        title={`Interface: ${selectedInterface || 'Default'}`}
        className="h-9 cursor-pointer appearance-none rounded-full bg-transparent pl-3 pr-7 font-mono text-[11px] tracking-[0.06em] text-soc-muted transition-colors hover:bg-white/[0.05] hover:text-soc-text focus-visible:outline-none"
      >
        {MODES.map((m) => (
          <option key={m} value={m} className="bg-soc-card">
            {m.replace('_', ' ')}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-soc-dim">▾</span>
    </label>

    {/* Button-in-button: the glyph lives in its own circle */}
    <button
      type="button"
      onClick={onToggleCapture}
      className={`group flex h-9 items-center gap-2 whitespace-nowrap rounded-full pl-4 pr-1 text-[12.5px] font-semibold transition-colors ${
        isCapturing
          ? 'bg-rose-500/10 text-rose-200 shadow-[inset_0_0_0_1px_rgb(242_122_110/0.35)] hover:bg-rose-500/20'
          : 'btn-signal'
      }`}
    >
      <span>{isCapturing ? 'Stop capture' : 'Start capture'}</span>
      <span
        aria-hidden="true"
        className={`relative grid h-7 w-7 place-items-center rounded-full transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${
          isCapturing ? 'bg-rose-400/20' : 'bg-black/15'
        }`}
      >
        <ArrowUpRight data-shown={!isCapturing} className="icon-swap absolute h-3.5 w-3.5" />
        <Square data-shown={isCapturing} className="icon-swap absolute h-3 w-3 fill-current" />
      </span>
    </button>
  </div>
);
