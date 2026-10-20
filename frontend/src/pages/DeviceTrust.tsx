import React, { useState, useEffect } from 'react';
import { KeyRound, RefreshCw, History, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { DeviceTrust as DeviceTrustType, TrustHistory } from '../types';
import { TrustBadge } from '../components/Badge';
import { usePresence } from '../hooks/usePresence';

export const DeviceTrust: React.FC = () => {
  const [devices, setDevices] = useState<DeviceTrustType[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [history, setHistory] = useState<TrustHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { rendered: historyEntity, state: historyState } = usePresence(selectedEntity, 250);

  const fetchDevices = async () => {
    try {
      const data = await api.getDeviceTrust();
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices', err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const openHistory = async (entityId: string) => {
    setSelectedEntity(entityId);
    setLoadingHistory(true);
    try {
      const data = await api.getTrustHistory(entityId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load trust history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Dynamic Trust Scoring & Behavioral Posture
          </h2>
          <p className="text-xs text-soc-dim">
            Explainable 0–100 trust scores with algorithmic penalty deduction and behavior-risk index.
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Trust
        </button>
      </div>

      {/* Trust Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Entity / IP</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Trust Score</th>
                <th className="py-2.5 px-3">Behavior Risk</th>
                <th className="py-2.5 px-3">Current State</th>
                <th className="py-2.5 px-3">Incidents</th>
                <th className="py-2.5 px-3">Latest Penalty Justification</th>
                <th className="py-2.5 px-3 text-right">Audit History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {devices.length > 0 ? (
                devices.map((d) => (
                  <tr key={d.entity_id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold">{d.ip_address}</td>
                    <td className="py-2 px-3 text-soc-dim">{d.mac_address}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-soc-text">{d.current_trust_score}</span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`bar-fill h-full w-full ${
                              d.current_trust_score >= 80
                                ? 'bg-emerald-400'
                                : d.current_trust_score >= 60
                                ? 'bg-amber-400'
                                : d.current_trust_score >= 30
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ transform: `scaleX(${Math.max(0, Math.min(100, d.current_trust_score)) / 100})` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-bold ${d.behavior_risk_score >= 70 ? 'text-rose-400 font-extrabold' : 'text-soc-muted'}`}>
                        {d.behavior_risk_score} / 100
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <TrustBadge state={d.state} />
                    </td>
                    <td className="py-2 px-3">{d.total_incidents}</td>
                    <td className="py-2 px-3 text-soc-dim truncate max-w-xs" title={d.last_penalty_reason || 'None'}>
                      {d.last_penalty_reason || 'Initial baseline'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => openHistory(d.entity_id)}
                        className="px-2.5 py-1 rounded bg-soc-bg hover:bg-soc-border border border-soc-border text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-soc-dim">
                    No active device entities recorded. Telemetry will establish endpoints as traffic arrives.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyEntity && (
        <div data-overlay data-state={historyState} className="overlay-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div data-state={historyState} className="modal-panel panel max-w-xl w-full p-5 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-soc-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-soc-text text-sm">Trust Score Audit Log: {historyEntity}</h3>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="text-soc-muted hover:text-soc-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {history.length > 0 ? (
                history.map((h) => (
                  <div key={h.id} className="p-3 inset-well space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-soc-dim">{new Date(h.timestamp).toLocaleString()}</span>
                      <span className="font-bold text-rose-400">-{h.penalty_applied} Points</span>
                    </div>
                    <div className="flex items-center gap-2 text-soc-muted">
                      <span>Score Transition:</span>
                      <span className="line-through">{h.previous_score}</span>
                      <span>→</span>
                      <span className="font-bold text-soc-text">{h.new_score}</span>
                    </div>
                    <p className="text-soc-text text-[11px] font-semibold">{h.reason}</p>
                    {h.event_id && <p className="text-[10px] text-soc-dim">Trigger Event Ref: {h.event_id}</p>}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-soc-dim">
                  No penalty history logged. Host maintained perfect 100 trust score.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
