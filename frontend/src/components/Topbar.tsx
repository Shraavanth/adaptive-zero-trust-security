import React, { useState, useEffect } from 'react';
import { Play, Square, Radio, Shield, Clock } from 'lucide-react';
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
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  isCapturing,
  currentMode,
  selectedInterface,
  onToggleCapture,
  onChangeMode,
  packetRate = 0,
  isConnected
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
    <header className="h-14 bg-soc-bg border-b border-soc-border px-6 flex items-center justify-between shrink-0 select-none">
      {/* Title & Mode */}
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-soc-text tracking-wide">{pageTitle}</h2>
        <div className="h-4 w-px bg-soc-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-soc-dim font-mono">MODE:</span>
          <select
            value={currentMode}
            onChange={(e) => onChangeMode(e.target.value as OperatingMode)}
            className="bg-soc-card border border-soc-border text-soc-text text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-blue-500"
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
      <div className="flex items-center gap-4">
        {/* Packet Rate */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-soc-card border border-soc-border text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-emerald-400 radar-live' : 'bg-slate-500'}`} />
          <span className="text-soc-muted">TRAFFIC:</span>
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
          onClick={onToggleCapture}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium font-mono transition-all duration-150 ${
            isCapturing
              ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300'
              : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300'
          }`}
        >
          {isCapturing ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isCapturing ? 'STOP CAPTURE' : 'START CAPTURE'}</span>
        </button>

        {/* Stream Health */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-soc-dim">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>{isConnected ? 'LIVE SSE' : 'DISCONNECTED'}</span>
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
