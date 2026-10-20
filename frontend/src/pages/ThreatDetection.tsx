import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  FolderPlus,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityEvent } from '../types';
import { SeverityBadge, ModeBadge } from '../components/Badge';
import { ThreatModal } from '../components/ThreatModal';

export const ThreatDetection: React.FC = () => {
  const [threats, setThreats] = useState<SecurityEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<SecurityEvent | null>(null);
  const [modalEvent, setModalEvent] = useState<SecurityEvent | null>(null);

  const fetchThreats = async () => {
    try {
      const data = await api.getThreats({ limit: 100 });
      setThreats(data);
    } catch (err) {
      console.error('Failed to load threats', err);
    }
  };

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredThreats = threats.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && t.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.src_ip.toLowerCase().includes(q) ||
        t.rule_id.toLowerCase().includes(q) ||
        (t.domain || '').toLowerCase().includes(q) ||
        t.detection_reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Cyber Threat Detection Engine
          </h2>
          <p className="text-xs text-soc-dim">
            Algorithmic detections for Phishing (Typosquat/DGA), ARP Cache Poisoning, and DNS Spoofing. Total events: {threats.length}
          </p>
        </div>
        <button
          onClick={fetchThreats}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Threats
        </button>
      </div>

      {/* Filter Row */}
      <div className="panel p-3 flex flex-wrap items-center gap-3 text-xs font-mono">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-soc-dim" />
          <input
            type="text"
            placeholder="Search Event ID, Offending IP, Domain or Rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full inset-well pl-9 pr-3 py-1.5 text-soc-text placeholder:text-soc-dim focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-soc-dim">CATEGORY:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="inset-well px-2.5 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ALL</option>
            <option value="PHISHING">PHISHING</option>
            <option value="ARP_SPOOFING">ARP_SPOOFING</option>
            <option value="DNS_SPOOFING">DNS_SPOOFING</option>
            <option value="PORT_SCAN">PORT_SCAN</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-soc-dim">SEVERITY:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="inset-well px-2.5 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Grid: Events Table + Evidence Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Table */}
        <div className="lg:col-span-2 panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="thead-soc">
                <tr>
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Offending IP</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Rule</th>
                  <th className="py-2.5 px-3 text-right">Escalate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-border/40 text-soc-text">
                {filteredThreats.length > 0 ? (
                  filteredThreats.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedThreat(t)}
                      className={`cursor-pointer transition-colors ${
                        selectedThreat?.id === t.id ? 'bg-blue-950/40 border-l-2 border-l-blue-400' : 'hover:bg-soc-cardHover'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-blue-400">{t.id}</td>
                      <td className="py-2 px-3 font-semibold">{t.category}</td>
                      <td className="py-2 px-3">
                        <SeverityBadge severity={t.severity} />
                      </td>
                      <td className="py-2 px-3 font-bold">{t.src_ip}</td>
                      <td className="py-2 px-3 text-soc-dim">{(t.confidence * 100).toFixed(0)}%</td>
                      <td className="py-2 px-3 text-soc-dim text-[11px]">{t.rule_id}</td>
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setModalEvent(t)}
                          className="px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <FolderPlus className="w-3 h-3" /> Case
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-soc-dim">
                      No security incidents detected matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Threat Evidence Inspector */}
        <div className="panel p-4 font-mono text-xs space-y-4">
          <div className="border-b border-soc-border pb-2 flex items-center justify-between">
            <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider">Threat Evidence</h3>
            {selectedThreat && <SeverityBadge severity={selectedThreat.severity} />}
          </div>

          {selectedThreat ? (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-soc-dim uppercase">Incident Description</span>
                <p className="text-soc-text font-bold mt-0.5">{selectedThreat.detection_reason}</p>
              </div>

              <div>
                <span className="text-[10px] text-soc-dim uppercase">Evidence Log</span>
                <p className="bg-soc-bg rounded p-2.5 border border-soc-border text-soc-muted break-words text-[11px] leading-relaxed">
                  {selectedThreat.evidence}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-soc-bg rounded p-2 border border-soc-border">
                  <span className="text-soc-dim">Target Domain:</span>
                  <p className="text-soc-text font-bold truncate">{selectedThreat.domain || 'N/A'}</p>
                </div>
                <div className="bg-soc-bg rounded p-2 border border-soc-border">
                  <span className="text-soc-dim">Calculated Risk:</span>
                  <p className="text-rose-400 font-bold">{selectedThreat.risk_score} / 100</p>
                </div>
              </div>

              <div className="pt-2 border-t border-soc-border flex items-center justify-between">
                <span className="text-soc-dim">Recommended Policy:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 border border-rose-800 text-rose-300">
                  {selectedThreat.recommended_response}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-soc-dim">
              Select an incident from the table to inspect underlying packet evidence and rule forensics.
            </div>
          )}
        </div>
      </div>

      {/* Investigation Modal */}
      <ThreatModal
        event={modalEvent}
        onClose={() => setModalEvent(null)}
        onInvestigationCreated={fetchThreats}
      />
    </div>
  );
};
