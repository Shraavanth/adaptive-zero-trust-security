import React, { useState, useEffect } from 'react';
import { Play, Square, Radio, Clock, Menu } from 'lucide-react';
import { OperatingMode } from '../types';
import { ModeBadge } from './Badge';

interface TopbarProps {
  pageTitle: string;
  isCapturing: boolean;
  currentMode: OperatingMode;
  selectedInterface: string;
  onToggleCapture: () => void;
  onChangeMode: (mode: OperatingMode) => void;
  packetRate?: number;
  isConnected: boolean;
  onOpenMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  isCapturing,
  currentMode,
  selectedInterface,
  onToggleCapture,
  onChangeMode,
  packetRate = 0,
  isConnected,
  onOpenMenu
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-30 flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-soc-border bg-soc-bg px-3 py-2 sm:px-5 lg:px-6">
      {/* Title & Mode */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-soc-border text-soc-muted transition-colors hover:bg-soc-cardHover hover:text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
        >
          <Menu aria-hidden="true" className="h-4 w-4" />
        </button>
        <h2 className="min-w-0 truncate text-sm font-semibold tracking-wide text-soc-text sm:text-base">{pageTitle}</h2>
        <div className="hidden h-4 w-px bg-soc-border sm:block" />
        <div className="hidden items-center gap-2 xl:flex">
          <span className="text-xs text-soc-dim font-mono">MODE:</span>
          <select
            value={currentMode}
            onChange={(e) => onChangeMode(e.target.value as OperatingMode)}
            aria-label="Operating mode"
            className="rounded border border-soc-border bg-soc-card px-2 py-1 font-mono text-xs text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <option value="SIMULATED_TEST">SIMULATED_TEST</option>
            <option value="LIVE_CAPTURE">LIVE_CAPTURE</option>
            <option value="CONTROLLED_LAB">CONTROLLED_LAB</option>
            <option value="OFFLINE_REPLAY">OFFLINE_REPLAY</option>
          </select>
          <ModeBadge mode={currentMode} />
        </div>
      </div>

      {/* Right controls: telemetry, interface, capture action, live clock */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3 lg:gap-4">
        <div className="flex items-center gap-2 xl:hidden">
          <span className="hidden text-xs font-mono text-soc-dim sm:inline">MODE:</span>
          <select
            value={currentMode}
            onChange={(e) => onChangeMode(e.target.value as OperatingMode)}
            aria-label="Operating mode"
            className="max-w-[150px] rounded border border-soc-border bg-soc-card px-2 py-1.5 font-mono text-[10px] text-soc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:text-xs"
          >
            <option value="SIMULATED_TEST">SIMULATED_TEST</option>
            <option value="LIVE_CAPTURE">LIVE_CAPTURE</option>
            <option value="CONTROLLED_LAB">CONTROLLED_LAB</option>
            <option value="OFFLINE_REPLAY">OFFLINE_REPLAY</option>
          </select>
        </div>

        {/* Packet Rate */}
        <div className="flex items-center gap-2 rounded border border-soc-border bg-soc-card px-2 py-1.5 font-mono text-[10px] sm:px-2.5 sm:text-xs">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isCapturing ? 'bg-emerald-400 radar-live' : 'bg-slate-500'}`} />
          <span className="hidden text-soc-muted md:inline">TRAFFIC:</span>
          <span className="text-soc-text font-bold">{packetRate} pkt/s</span>
        </div>

        {/* Selected Interface */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-soc-dim">
          <span>IFACE:</span>
          <span className="text-soc-text bg-soc-card px-2 py-0.5 rounded border border-soc-border max-w-[130px] truncate">
            {selectedInterface || 'Default'}
          </span>
        </div>

        {/* Capture Start/Stop button */}
        <button
          type="button"
          onClick={onToggleCapture}
          className={`flex h-9 items-center gap-1.5 rounded px-2 sm:px-3 text-xs font-medium font-mono transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isCapturing
              ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300'
              : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300'
          }`}
        >
          {isCapturing ? <Square aria-hidden="true" className="h-3.5 w-3.5 fill-current" /> : <Play aria-hidden="true" className="h-3.5 w-3.5 fill-current" />}
          <span className="hidden sm:inline">{isCapturing ? 'STOP CAPTURE' : 'START CAPTURE'}</span>
        </button>

        {/* Stream Health */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-soc-dim" role="status" aria-label={`Event stream ${isConnected ? 'connected' : 'disconnected'}`}>
          <Radio aria-hidden="true" className={`h-3.5 w-3.5 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="hidden lg:inline">{isConnected ? 'LIVE SSE' : 'DISCONNECTED'}</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden md:flex items-center gap-1 text-xs font-mono text-soc-muted border-l border-soc-border pl-3">
          <Clock className="w-3.5 h-3.5 text-soc-dim" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
