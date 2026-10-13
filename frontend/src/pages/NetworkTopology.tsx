import React, { useState, useEffect } from 'react';
import { GitFork, RefreshCw, Shield, Server, Laptop, Radar, Activity } from 'lucide-react';
import { api } from '../services/api';
import { TrustBadge } from '../components/Badge';

export const NetworkTopology: React.FC = () => {
  const [topology, setTopology] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const fetchTopology = async () => {
    try {
      const data = await api.getTopology();
      setTopology(data);
    } catch (err) {
      console.error('Failed to load topology', err);
    }
  };

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 6000);
    return () => clearInterval(interval);
  }, []);

  const getNodeIcon = (type: string) => {
    if (type === 'GATEWAY') return <Server className="w-5 h-5 text-blue-400" />;
    if (type === 'HONEYPOT') return <Radar className="w-5 h-5 text-cyan-400" />;
    return <Laptop className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-400" />
            Zero Trust Network Topology & Microsegmentation Graph
          </h2>
          <p className="text-soc-dim mt-0.5">
            Explicit visual separation of Configured Core Gateways, Discovered Endpoints, and Simulated Honeypots.
          </p>
        </div>
        <button
          onClick={fetchTopology}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Topology
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Node Grid */}
        <div className="lg:col-span-2 bg-soc-card border border-soc-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] text-soc-dim border-b border-soc-border pb-2">
            <span>DISCOVERED & CONFIGURED NETWORK ENTITIES ({topology.nodes.length})</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Gateway</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Endpoint</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Decoy</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topology.nodes.map((n) => {
              const isSelected = selectedNode?.id === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md'
                      : n.status === 'ISOLATE'
                      ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-600'
                      : 'bg-soc-bg border-soc-border hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded bg-soc-card border border-soc-border">
                      {getNodeIcon(n.type)}
                    </div>
                    <span className="text-[10px] text-soc-dim uppercase font-bold">{n.category}</span>
                  </div>
                  <h4 className="font-bold text-soc-text text-sm mt-2 truncate">{n.label}</h4>
                  <p className="text-[11px] text-soc-dim truncate mt-0.5">{n.ip}</p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-soc-border/50">
                    <TrustBadge state={n.status} />
                    {n.trust_score !== undefined && (
                      <span className="text-soc-muted font-bold">{n.trust_score} pts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observed Flow Edges Table */}
          <div className="pt-4 border-t border-soc-border space-y-2">
            <h4 className="font-bold text-soc-dim text-[11px] uppercase tracking-wider">Observed Inter-Node Communications ({topology.links.length})</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {topology.links.map((link, idx) => (
                <div key={idx} className="p-2 bg-soc-bg rounded border border-soc-border flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-soc-text font-bold">{link.source}</span>
                    <span className="text-soc-dim">⟷</span>
                    <span className="text-soc-text font-bold">{link.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{link.protocol}</span>
                    <span className="text-soc-dim">{link.packet_count} pkts</span>
                    {link.is_malicious && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-bold border border-rose-800">
                        ATTACK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider border-b border-soc-border pb-2">
            Node Telemetry Inspector
          </h3>
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <span className="text-soc-dim text-[10px] uppercase">Entity Identity</span>
                <h4 className="text-sm font-bold text-soc-text">{selectedNode.label}</h4>
                <p className="text-soc-dim">{selectedNode.ip}</p>
              </div>
              <div className="bg-soc-bg rounded p-3 border border-soc-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-soc-dim">Node Category:</span>
                  <span className="text-soc-text font-bold">{selectedNode.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soc-dim">Classification:</span>
                  <span className="text-blue-400 font-bold">{selectedNode.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soc-dim">Zero Trust State:</span>
                  <TrustBadge state={selectedNode.status} />
                </div>
                {selectedNode.trust_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-soc-dim">Trust Rating:</span>
                    <span className="text-soc-text font-bold">{selectedNode.trust_score} / 100</span>
                  </div>
                )}
                {selectedNode.risk_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-soc-dim">Behavior Risk:</span>
                    <span className="text-rose-400 font-bold">{selectedNode.risk_score} / 100</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-soc-dim">
              Click any node in the topology to inspect its trust state, risk indicators, and relationship edges.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
