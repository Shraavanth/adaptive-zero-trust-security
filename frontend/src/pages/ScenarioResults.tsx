import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, XCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ScenarioResult } from '../types';
import { ModeBadge } from '../components/Badge';

export const ScenarioResults: React.FC = () => {
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      const data = await api.getScenarioResults();
      setResults(data);
    } catch (err) {
      console.error('Failed to load scenario results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Controlled Scenario Test Verification Ledger
          </h2>
          <p className="text-soc-dim mt-0.5">
            Validation matrix compares observed packet detection, trust history, and policy records. Responses are simulated.
          </p>
        </div>
        <button
          onClick={fetchResults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Results
        </button>
      </div>

      <div className="bg-soc-card border border-soc-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-soc-bg/90 border-b border-soc-border text-soc-dim text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Scenario Name</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Expected Outcome</th>
                <th className="py-2.5 px-3">Actual Outcome</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {results.length > 0 ? (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{r.id}</td>
                    <td className="py-2 px-3 font-bold text-soc-text">{r.scenario_name}</td>
                    <td className="py-2 px-3">
                      <ModeBadge mode={r.mode} />
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'PASSED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {r.status === 'PASSED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-soc-dim max-w-xs truncate" title={r.expected_outcome}>
                      {r.expected_outcome}
                    </td>
                    <td className="py-2 px-3 text-soc-muted max-w-xs truncate font-semibold" title={r.actual_outcome}>
                      {r.actual_outcome}
                    </td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {r.duration_ms.toFixed(1)} ms
                    </td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-soc-dim">
                    No scenario results logged yet. Run a scenario from Controlled Testing to verify pipeline.
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
