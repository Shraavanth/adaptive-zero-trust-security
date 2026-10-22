import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { CaptureSession } from '../types';
import { ModeBadge } from '../components/Badge';

export const CaptureSessions: React.FC = () => {
  const [sessions, setSessions] = useState<CaptureSession[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await api.getCaptureSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load capture sessions', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMsg('Parsing PCAP frames and feeding replay pipeline...');
    try {
      const res = await api.uploadPcap(file);
      setUploadMsg(`Successfully replayed ${res.packets_replayed} packets from ${file.name}!`);
      await fetchSessions();
    } catch (err) {
      setUploadMsg(`Replay failed: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            Packet Capture Session History & PCAP Replay
          </h2>
          <p className="text-soc-dim mt-0.5">
            Audit log of all live capture runs and offline PCAP/PCAPNG replay forensic sessions.
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Sessions
        </button>
      </div>

      {/* PCAP Upload Section */}
      <div className="panel p-4 space-y-2">
        <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-400" /> Offline PCAP / PCAPNG Replay Ingestion
        </h3>
        <p className="text-soc-dim text-[11px]">
          Import a packet trace file (.pcap or .pcapng) to run through normalization, threat detection, and trust scoring.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <label className="px-4 py-2 rounded btn-signal font-bold cursor-pointer transition-colors inline-flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" /> Select PCAP File
            <input
              type="file"
              accept=".pcap,.pcapng,.cap"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {uploadMsg && <span className="text-soc-muted">{uploadMsg}</span>}
        </div>
      </div>

      {/* Session History Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Session ID</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Interface / Target</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total Packets</th>
                <th className="py-2.5 px-3">Started At</th>
                <th className="py-2.5 px-3">Ended At</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {sessions.length > 0 ? (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{s.id}</td>
                    <td className="py-2 px-3">
                      <ModeBadge mode={s.mode} />
                    </td>
                    <td className="py-2 px-3 font-semibold">{s.interface_name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold">{s.total_packets.toLocaleString()}</td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(s.start_time).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {s.end_time ? new Date(s.end_time).toLocaleTimeString() : 'In Progress'}
                    </td>
                    <td className="py-2 px-3 text-soc-dim max-w-xs truncate">
                      {s.notes || s.file_path || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-soc-dim">
                    No capture sessions stored yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
