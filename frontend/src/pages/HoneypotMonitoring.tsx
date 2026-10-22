import React, { useState, useEffect } from 'react';
import { Radar, RefreshCw, Shield, AlertTriangle, Radio } from 'lucide-react';
import { api } from '../services/api';
import { HoneypotInstance, HoneypotEvent } from '../types';

export const HoneypotMonitoring: React.FC = () => {
  const [honeypots, setHoneypots] = useState<HoneypotInstance[]>([]);
  const [events, setEvents] = useState<HoneypotEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [hpData, evtData] = await Promise.all([
        api.getHoneypots(),
        api.getHoneypotEvents()
      ]);
      setHoneypots(hpData);
      setEvents(evtData);
    } catch (err) {
      console.error('Failed to load honeypots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <Radar className="w-4 h-4 text-cyan-400" />
            Autonomous Decoy & Honeypot Monitoring
          </h2>
          <p className="text-soc-dim mt-0.5">
            Seeded decoy records and interaction logs. No HTTP, SSH, DNS, or Telnet listener is started by this application.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Honeypots
        </button>
      </div>

      {/* Deployed Honeypot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {honeypots.map((hp) => (
          <div key={hp.id} className="panel p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-soc-dim font-bold">{hp.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hp.status === 'ALERTING'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                {hp.status}
              </span>
            </div>
            <h3 className="font-bold text-soc-text text-sm truncate">{hp.name}</h3>
            <div className="text-[11px] text-soc-muted space-y-0.5">
              <p>Service: <span className="text-blue-400 font-bold">{hp.service_type}</span></p>
              <p>Binding: <span className="text-soc-text">{hp.ip_address}:{hp.port}</span></p>
              <p>Mode: <span className="text-cyan-400">{hp.mode}</span></p>
              <p>Adversary Probes: <span className="text-rose-400 font-bold">{hp.interaction_count}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Honeypot Interaction Events */}
      <div className="panel overflow-hidden">
        <div className="p-3 border-b border-soc-border bg-soc-bg/60 flex items-center justify-between">
          <h3 className="font-bold text-soc-text text-xs uppercase tracking-wider">
            Adversary Decoy Interaction Log ({events.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Event Ref</th>
                <th className="py-2.5 px-3">Honeypot Trap</th>
                <th className="py-2.5 px-3">Attacker Endpoint</th>
                <th className="py-2.5 px-3">Interaction Type</th>
                <th className="py-2.5 px-3">Threat Level</th>
                <th className="py-2.5 px-3">Payload Snippet</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {events.length > 0 ? (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{e.id}</td>
                    <td className="py-2 px-3">{e.honeypot_id}</td>
                    <td className="py-2 px-3 font-bold text-rose-400">
                      {e.src_ip}{e.src_port ? `:${e.src_port}` : ''}
                    </td>
                    <td className="py-2 px-3 font-semibold text-amber-300">{e.interaction_type}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {e.threat_level}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-soc-dim max-w-xs truncate" title={e.payload_snippet || ''}>
                      {e.payload_snippet || 'SYN probe handshake'}
                    </td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-soc-dim">
                    Decoys deployed and actively listening. No unauthorized adversary engagements recorded yet.
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
