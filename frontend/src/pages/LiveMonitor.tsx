import React, { useState, useEffect } from 'react';
import {
  Download,
  Pause,
  Play,
  Search,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Packet } from '../types';
import { PacketDrawer } from '../components/PacketDrawer';
import { ModeBadge } from '../components/Badge';

interface LiveMonitorProps {
  packets: Packet[];
  isCapturing: boolean;
  onToggleCapture: () => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ packets: streamPackets, isCapturing, onToggleCapture }) => {
  const [displayedPackets, setDisplayedPackets] = useState<Packet[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [maskData, setMaskData] = useState(true);
  const [isSavingMask, setIsSavingMask] = useState(false);
  const [maskSaveError, setMaskSaveError] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  useEffect(() => {
    api.getSettings()
      .then((configs) => setMaskData(configs.privacy_masking_enabled !== 'false'))
      .catch((err) => console.error('Failed to load privacy masking preference', err));
  }, []);

  // Load initial persisted packets from API
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const initial = await api.getPackets({ limit: 80 });
        setDisplayedPackets(initial);
      } catch (err) {
        console.error('Failed to load initial packets', err);
      }
    };
    fetchRecent();
  }, []);

  // Sync incoming real-time packets from props when not paused
  useEffect(() => {
    if (isPaused || streamPackets.length === 0) return;
    setDisplayedPackets((prev) => {
      const merged = [streamPackets[0], ...prev.filter((p) => p.id !== streamPackets[0].id)];
      return merged.slice(0, 200);
    });
  }, [streamPackets, isPaused]);

  // Filtering
  const filteredPackets = displayedPackets.filter((pkt) => {
    if (protocolFilter !== 'ALL' && pkt.protocol !== protocolFilter) return false;
    if (statusFilter !== 'ALL' && pkt.detection_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSrc = pkt.src_ip.toLowerCase().includes(q);
      const matchDst = pkt.dst_ip.toLowerCase().includes(q);
      const matchProto = pkt.protocol.toLowerCase().includes(q);
      const matchDns = (pkt.dns_query || '').toLowerCase().includes(q);
      const matchMac = (pkt.src_mac || '').toLowerCase().includes(q);
      if (!matchSrc && !matchDst && !matchProto && !matchDns && !matchMac) return false;
    }
    return true;
  });

  const maskIp = (ip: string) => {
    if (!maskData || !ip || ip === 'N/A') return ip;
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return ip.slice(0, 6) + '***';
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/packets/export/data?format=${format}&limit=500`, '_blank');
  };

  const handleToggleMask = async () => {
    const nextMaskData = !maskData;
    setIsSavingMask(true);
    setMaskSaveError('');
    try {
      await api.updateSettings({ privacy_masking_enabled: String(nextMaskData) });
      setMaskData(nextMaskData);
    } catch (err) {
      console.error('Failed to save privacy masking preference', err);
      setMaskSaveError('Unable to save privacy masking preference.');
    } finally {
      setIsSavingMask(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono">Live Packet Inspection Engine</h2>
          <p className="text-xs text-soc-dim">
            Deep packet inspection showing authentic L2/L3/L4 metadata. Total captured in buffer: {displayedPackets.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              isPaused
                ? 'bg-amber-950/80 border-amber-700 text-amber-300 hover:bg-amber-900'
                : 'bg-soc-bg hover:bg-soc-cardHover border-soc-border text-soc-muted hover:text-soc-text'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'RESUME STREAM' : 'PAUSE DISPLAY'}
          </button>

          {/* Privacy Mask Toggle */}
          <button
            onClick={handleToggleMask}
            disabled={isSavingMask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-xs font-mono text-soc-muted hover:text-soc-text transition-colors"
            title="Mask IP/MAC addresses in this view. Exported packet data is not masked."
          >
            {maskData ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
            {maskData ? 'MASKED' : 'REVEALED'}
          </button>
          {maskSaveError && <span role="alert" className="text-rose-400">{maskSaveError}</span>}

          {/* Export Dropdown */}
          <div className="flex items-center rounded border border-soc-border bg-soc-bg text-xs font-mono">
            <button
              onClick={() => handleExport('csv')}
              className="px-2.5 py-1.5 hover:bg-soc-cardHover text-soc-muted hover:text-soc-text flex items-center gap-1 border-r border-soc-border"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-2.5 py-1.5 hover:bg-soc-cardHover text-soc-muted hover:text-soc-text"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-soc-card border border-soc-border rounded-lg p-3 flex flex-wrap items-center gap-3 text-xs font-mono">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-soc-dim" />
          <input
            type="text"
            placeholder="Search Source IP, Dest IP, Domain or MAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-soc-bg border border-soc-border rounded pl-9 pr-3 py-1.5 text-soc-text placeholder:text-soc-dim focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-soc-dim">PROTOCOL:</span>
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="bg-soc-bg border border-soc-border rounded px-2.5 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ALL</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="DNS">DNS</option>
            <option value="ARP">ARP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-soc-dim">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-soc-bg border border-soc-border rounded px-2.5 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ALL</option>
            <option value="CLEAN">CLEAN</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
            <option value="MALICIOUS">MALICIOUS</option>
          </select>
        </div>
      </div>

      {/* Primary Packets Table */}
      <div className="bg-soc-card border border-soc-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-soc-bg/90 border-b border-soc-border text-soc-dim text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Src Port</th>
                <th className="py-2.5 px-3">Dst Port</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">Detection</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {filteredPackets.length > 0 ? (
                filteredPackets.map((pkt) => {
                  const isMalicious = pkt.detection_status === 'MALICIOUS';
                  const isSuspicious = pkt.detection_status === 'SUSPICIOUS';
                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`cursor-pointer transition-colors ${
                        isMalicious
                          ? 'bg-rose-950/20 hover:bg-rose-950/40 text-rose-300'
                          : isSuspicious
                          ? 'bg-amber-950/20 hover:bg-amber-950/40'
                          : 'hover:bg-soc-cardHover'
                      }`}
                    >
                      <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                        {new Date(pkt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-semibold whitespace-nowrap">
                        {maskIp(pkt.src_ip)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {maskIp(pkt.dst_ip)}
                      </td>
                      <td className="py-2 px-3 font-bold text-blue-400">
                        {pkt.protocol}
                      </td>
                      <td className="py-2 px-3 text-soc-dim">
                        {pkt.src_port ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-soc-dim">
                        {pkt.dst_port ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-soc-dim">
                        {pkt.length} B
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isMalicious
                              ? 'bg-rose-950 border-rose-800 text-rose-300'
                              : isSuspicious
                              ? 'bg-amber-950 border-amber-800 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                          }`}
                        >
                          {pkt.detection_status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button className="text-blue-400 hover:text-blue-300 text-xs">
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-soc-dim">
                    {isCapturing
                      ? 'Listening for packets on selected network interface...'
                      : 'Capture is currently stopped. Click "START CAPTURE" in the top bar to begin.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspection Drawer */}
      <PacketDrawer
        packet={selectedPacket}
        onClose={() => setSelectedPacket(null)}
        maskData={maskData}
      />
    </div>
  );
};
