import React, { useState, useEffect } from 'react';
import { FileCheck2, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ZeroTrustDecision } from '../types';
import { TrustBadge, ModeBadge } from '../components/Badge';

export const ZeroTrustDecisions: React.FC = () => {
  const [decisions, setDecisions] = useState<ZeroTrustDecision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecisions = async () => {
    try {
      const data = await api.getDecisions(100);
      setDecisions(data);
    } catch (err) {
      console.error('Failed to load decisions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-400" />
            Zero Trust Policy Evaluation Engine
          </h2>
          <p className="text-xs text-soc-dim">
            Authoritative access boundary decisions (ALLOW / MONITOR / RESTRICT / ISOLATE) with explainable rule telemetry.
          </p>
        </div>
        <button
          onClick={fetchDecisions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-xs font-mono text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Policies
        </button>
      </div>

      <div className="bg-soc-card border border-soc-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-soc-bg/90 border-b border-soc-border text-soc-dim text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3">Decision ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Trust</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Policy Decision</th>
                <th className="py-2.5 px-3">Execution Status</th>
                <th className="py-2.5 px-3">Policy Reason</th>
                <th className="py-2.5 px-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {decisions.length > 0 ? (
                decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{d.id}</td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-semibold">{d.entity_id}</td>
                    <td className="py-2 px-3 font-bold">{d.trust_score}</td>
                    <td className="py-2 px-3 font-bold text-rose-400">{d.behavior_risk}</td>
                    <td className="py-2 px-3">
                      <TrustBadge state={d.decision} />
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-soc-muted">
                        {d.execution_status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-soc-dim max-w-sm truncate" title={d.reason}>
                      {d.reason}
                    </td>
                    <td className="py-2 px-3">
                      <ModeBadge mode={d.mode} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-soc-dim">
                    No Zero Trust policy decisions recorded. Trigger a test scenario to evaluate policy rules.
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
