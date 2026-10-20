import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { NetworkFlow } from '../types';

export const NetworkFlows: React.FC = () => {
  const [flows, setFlows] = useState<NetworkFlow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = async () => {
    try {
      const data = await api.getFlows(100);
      setFlows(data);
    } catch (err) {
      console.error('Failed to load flows', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    const interval = setInterval(fetchFlows, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            Network Flow Aggregator (5-Tuple Session Table)
          </h2>
          <p className="text-xs text-soc-dim">
            Bidirectional host communications, byte volumes, durations, and security event correlations.
          </p>
        </div>
        <button
          onClick={fetchFlows}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Flows
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Flow ID</th>
                <th className="py-2.5 px-3">Source Endpoint</th>
                <th className="py-2.5 px-3">Destination Endpoint</th>
                <th className="py-2.5 px-3">Proto</th>
                <th className="py-2.5 px-3">Packets</th>
                <th className="py-2.5 px-3">Volume</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Last Seen</th>
                <th className="py-2.5 px-3">Threat Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {flows.length > 0 ? (
                flows.map((f) => (
                  <tr key={f.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 text-soc-dim font-bold">{f.id}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold">{f.src_ip}</span>
                      {f.src_port && <span className="text-soc-dim">:{f.src_port}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold">{f.dst_ip}</span>
                      {f.dst_port && <span className="text-soc-dim">:{f.dst_port}</span>}
                    </td>
                    <td className="py-2 px-3 text-blue-400 font-bold">{f.protocol}</td>
                    <td className="py-2 px-3">{f.packet_count} pkts</td>
                    <td className="py-2 px-3">{(f.byte_count / 1024).toFixed(1)} KB</td>
                    <td className="py-2 px-3 text-soc-dim">{f.duration_seconds.toFixed(1)}s</td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(f.last_seen).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      {f.linked_event_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          <ShieldAlert className="w-3 h-3" /> THREAT LINKED
                        </span>
                      ) : (
                        <span className="text-soc-dim">CLEAN</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-soc-dim">
                    No active network flows recorded. Start live packet capture or run a controlled test scenario.
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
