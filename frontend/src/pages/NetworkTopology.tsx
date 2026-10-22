import React, { useState, useEffect } from 'react';
import { GitFork, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { TrustBadge } from '../components/Badge';
import { TopologyGraph } from '../components/viz/TopologyGraph';

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

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
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
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Topology
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Node Grid */}
        <div className="lg:col-span-2 panel p-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] text-soc-dim border-b border-soc-border pb-2">
            <span>DISCOVERED & CONFIGURED NETWORK ENTITIES ({topology.nodes.length})</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rotate-45 bg-signal-400" /> Gateway</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-signal-400" /> Host</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px] border border-dashed border-ice-400" /> Decoy</span>
              <span className="flex items-center gap-1.5"><span className="h-px w-4 bg-rose-400" /> Attack flow</span>
            </div>
          </div>

          <div className="-mx-2 aspect-[820/640] w-[calc(100%+1rem)]">
            <TopologyGraph
              nodes={topology.nodes}
              links={topology.links}
              selectedId={selectedNode?.id ?? null}
              onSelect={(n) => setSelectedNode(n)}
            />
          </div>

          {/* Observed Flow Edges Table */}
          <div className="pt-4 border-t border-soc-border space-y-2">
            <h4 className="font-bold text-soc-dim text-[11px] uppercase tracking-wider">Observed Inter-Node Communications ({topology.links.length})</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {topology.links.map((link, idx) => (
                <div key={idx} className="p-2 inset-well flex items-center justify-between text-[11px]">
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
        <div className="panel p-5 space-y-4">
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
              <div className="inset-well p-3 space-y-2">
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
