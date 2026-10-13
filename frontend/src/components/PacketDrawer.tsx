import React from 'react';
import { X, ShieldAlert, Cpu, Network, Info } from 'lucide-react';
import { Packet } from '../types';
import { SeverityBadge, ModeBadge } from './Badge';

interface PacketDrawerProps {
  packet: Packet | null;
  onClose: () => void;
  maskData?: boolean;
}

export const PacketDrawer: React.FC<PacketDrawerProps> = ({ packet, onClose, maskData = false }) => {
  if (!packet) return null;

  const maskIp = (ip: string) => {
    if (!maskData || !ip || ip === 'N/A') return ip;
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
    return ip.slice(0, 6) + '***';
  };

  const maskMac = (mac: string) => {
    if (!maskData || !mac || mac === 'N/A') return mac;
    return mac.slice(0, 9) + '**:**:**';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-soc-card border-l border-soc-border shadow-2xl z-50 flex flex-col font-mono text-xs">
      {/* Drawer Header */}
      <div className="p-4 border-b border-soc-border flex items-center justify-between bg-soc-bg/60">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-soc-text text-sm">Packet Inspection #{packet.id}</span>
          <ModeBadge mode={packet.mode} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-soc-border text-soc-muted hover:text-soc-text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Detection Status Banner */}
        <div className={`p-3 rounded border flex items-center justify-between ${
          packet.detection_status === 'MALICIOUS'
            ? 'bg-rose-950/60 border-rose-800 text-rose-300'
            : packet.detection_status === 'SUSPICIOUS'
            ? 'bg-amber-950/60 border-amber-800 text-amber-300'
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold">SECURITY STATUS: {packet.detection_status}</span>
          </div>
          {packet.related_event_id && (
            <span className="text-[11px] underline">Ref: {packet.related_event_id}</span>
          )}
        </div>

        {/* Section: IP & Addressing */}
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-wider text-soc-dim font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Layer 3 / 4 Headers ({packet.ip_version})
          </h4>
          <div className="bg-soc-bg rounded p-3 border border-soc-border space-y-1.5">
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Source IP:</span>
              <span className="text-soc-text font-bold">{maskIp(packet.src_ip)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Destination IP:</span>
              <span className="text-soc-text font-bold">{maskIp(packet.dst_ip)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Protocol:</span>
              <span className="text-blue-400 font-bold">{packet.protocol}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Source Port:</span>
              <span className="text-soc-text">{packet.src_port ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Destination Port:</span>
              <span className="text-soc-text">{packet.dst_port ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Packet Length:</span>
              <span className="text-soc-text">{packet.length} bytes</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-soc-muted">TTL / Hop Limit:</span>
              <span className="text-soc-text">{packet.ttl ?? 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section: Ethernet & MAC Layer */}
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-wider text-soc-dim font-bold flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-purple-400" />
            Layer 2 Data Link (Ethernet)
          </h4>
          <div className="bg-soc-bg rounded p-3 border border-soc-border space-y-1.5">
            <div className="flex justify-between py-1 border-b border-soc-border/40">
              <span className="text-soc-muted">Source MAC:</span>
              <span className="text-soc-text">{maskMac(packet.src_mac)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-soc-muted">Destination MAC:</span>
              <span className="text-soc-text">{maskMac(packet.dst_mac)}</span>
            </div>
          </div>
        </div>

        {/* Section: ARP Payload (If applicable) */}
        {(packet.protocol === 'ARP' || packet.ip_version === 'ARP' || packet.arp_opcode) && (
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-soc-dim font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              ARP Protocol Specifics
            </h4>
            <div className="bg-soc-bg rounded p-3 border border-amber-900/40 space-y-1.5 text-amber-300">
              <div className="flex justify-between py-1 border-b border-soc-border/40">
                <span className="text-soc-muted">ARP Opcode:</span>
                <span className="font-bold">{packet.arp_opcode || 'reply'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-soc-border/40">
                <span className="text-soc-muted">Sender Protocol IP:</span>
                <span>{maskIp(packet.arp_sender_ip || packet.src_ip)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-soc-border/40">
                <span className="text-soc-muted">Sender Hardware MAC:</span>
                <span>{maskMac(packet.arp_sender_mac || packet.src_mac)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-soc-border/40">
                <span className="text-soc-muted">Target Protocol IP:</span>
                <span>{maskIp(packet.arp_target_ip || packet.dst_ip)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-soc-muted">Target Hardware MAC:</span>
                <span>{maskMac(packet.arp_target_mac || packet.dst_mac)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: DNS Payload (If applicable) */}
        {(packet.dns_query || packet.dns_reply) && (
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-soc-dim font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              DNS Payload Metadata
            </h4>
            <div className="bg-soc-bg rounded p-3 border border-soc-border space-y-1.5">
              <div className="flex justify-between py-1 border-b border-soc-border/40">
                <span className="text-soc-muted">Query Name:</span>
                <span className="text-cyan-400 font-bold break-all">{packet.dns_query}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-soc-muted">DNS Answer:</span>
                <span className="text-soc-text font-bold break-all">{packet.dns_reply || 'Pending / Recursive'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Capture Metadata */}
        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-wider text-soc-dim font-bold">Metadata & Environment</h4>
          <div className="bg-soc-bg rounded p-3 border border-soc-border text-soc-dim space-y-1">
            <p>Session ID: <span className="text-soc-text">{packet.session_id}</span></p>
            <p>Interface: <span className="text-soc-text">{packet.interface}</span></p>
            <p>Timestamp: <span className="text-soc-text">{new Date(packet.timestamp).toISOString()}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
