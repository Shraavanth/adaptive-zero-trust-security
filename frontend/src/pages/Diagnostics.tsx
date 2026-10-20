import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Database, Shield } from 'lucide-react';
import { api } from '../services/api';
import { DiagnosticsData } from '../types';

export const Diagnostics: React.FC = () => {
  const [diag, setDiag] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiag = async () => {
    try {
      const data = await api.getDiagnostics();
      setDiag(data);
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiag();
  }, []);

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />;

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            SOC Framework Diagnostic Telemetry & Driver Health
          </h2>
          <p className="text-soc-dim mt-0.5">
            Validation of native TShark decoding binaries, Npcap kernel drivers, SQLite tables, and capture queues.
          </p>
        </div>
        <button
          onClick={fetchDiag}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-run Diagnostics
        </button>
      </div>

      {diag ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Core System Dependencies */}
          <div className="panel p-4 space-y-3">
            <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider border-b border-soc-border pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Binary Decoders & Driver Subsystem
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 inset-well">
                <div className="flex items-center gap-2">
                  <StatusIcon ok={diag.tshark_installed} />
                  <span>Wireshark / TShark Engine</span>
                </div>
                <span className="text-soc-muted">{diag.tshark_installed ? 'Installed' : 'Missing'}</span>
              </div>
              <p className="text-[11px] text-soc-dim px-2">Path: {diag.tshark_path}</p>
              <p className="text-[11px] text-soc-dim px-2">Version: {diag.tshark_version}</p>

              <div className="flex items-center justify-between p-2 inset-well mt-3">
                <div className="flex items-center gap-2">
                  <StatusIcon ok={diag.npcap_installed} />
                  <span>Npcap Packet Driver (Windows)</span>
                </div>
                <span className="text-soc-muted">{diag.npcap_installed ? 'Present' : 'Not Detected'}</span>
              </div>

              <div className="flex items-center justify-between p-2 inset-well">
                <div className="flex items-center gap-2">
                  <StatusIcon ok={diag.scapy_available} />
                  <span>Scapy Packet Engine</span>
                </div>
                <span className="text-emerald-400 font-bold">Ready</span>
              </div>

              <div className="p-2.5 inset-well text-[11px] text-soc-muted">
                <span className="text-soc-dim font-bold">Capture Permissions: </span>
                {diag.capture_permissions}
              </div>
            </div>
          </div>

          {/* Persistent Storage & Telemetry */}
          <div className="panel p-4 space-y-3">
            <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider border-b border-soc-border pb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" /> Persistent Storage & State
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 inset-well">
                <div className="flex items-center gap-2">
                  <StatusIcon ok={diag.database_status === 'CONNECTED'} />
                  <span>SQLite Database Persistence</span>
                </div>
                <span className="text-emerald-400 font-bold">{diag.database_status}</span>
              </div>
              <p className="text-[11px] text-soc-dim px-2 break-all">DB File: {diag.database_file}</p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-3 inset-well">
                  <span className="text-soc-dim text-[10px] uppercase">Stored Packet Records</span>
                  <p className="text-lg font-bold text-soc-text mt-1">{diag.total_stored_packets.toLocaleString()}</p>
                </div>
                <div className="p-3 inset-well">
                  <span className="text-soc-dim text-[10px] uppercase">Stored Security Events</span>
                  <p className="text-lg font-bold text-rose-400 mt-1">{diag.total_stored_events.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-2.5 inset-well text-[11px] flex justify-between">
                <span className="text-soc-dim">Active Capture Session:</span>
                <span className="text-soc-text font-bold">{diag.active_capture_session || 'None (Idle)'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-soc-dim">Loading diagnostic report...</div>
      )}
    </div>
  );
};
