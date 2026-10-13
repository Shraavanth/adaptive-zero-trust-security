import React, { useState, useEffect } from 'react';
import { HeartPulse, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Play } from 'lucide-react';
import { api } from '../services/api';
import { SelfHealingPlan } from '../types';

export const SelfHealing: React.FC = () => {
  const [plans, setPlans] = useState<SelfHealingPlan[]>([]);
  const [evalEntity, setEvalEntity] = useState('192.168.1.188');
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchPlans = async () => {
    try {
      const data = await api.getHealingPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load healing plans', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    const interval = setInterval(fetchPlans, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await api.evaluateHealing(evalEntity);
      setEvalResult(res);
    } catch (err) {
      alert(`Evaluation error: ${err}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const plan = await api.executeHealing(evalEntity, true);
      alert(`Self-healing plan ${plan.id} executed with status: ${plan.status}`);
      await fetchPlans();
      handleEvaluate();
    } catch (err) {
      alert(`Recovery execution error: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const breakdown = evalResult?.breakdown || {};

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            Autonomous Self-Healing & Dynamic Network Recovery Engine
          </h2>
          <p className="text-soc-dim mt-0.5">
            Strict prerequisite validation: 5-minute clean telemetry window, Trust score &ge; 80, Risk &lt; 70, Repeat offender compliance.
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Plans
        </button>
      </div>

      {/* Interactive Prerequisite Evaluator */}
      <div className="bg-soc-card border border-soc-border rounded-lg p-5 space-y-4">
        <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Prerequisite Audit & Verification Console
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-soc-dim mb-1 font-medium">Candidate Entity IP Address</label>
            <input
              type="text"
              value={evalEntity}
              onChange={(e) => setEvalEntity(e.target.value)}
              placeholder="e.g. 192.168.1.188"
              className="w-full bg-soc-bg border border-soc-border rounded px-3 py-2 text-soc-text focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end gap-2 pt-5">
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50"
            >
              {isEvaluating ? 'Evaluating...' : 'Audit Prerequisites'}
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting || !evalResult?.prerequisites_satisfied}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Executing...' : 'Trigger Autonomous Recovery'}
            </button>
          </div>
        </div>

        {evalResult && (
          <div className="p-4 bg-soc-bg border border-soc-border rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-soc-border pb-2">
              <span className="font-bold text-soc-text">Audit Outcome for {evalResult.entity_id}:</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                evalResult.prerequisites_satisfied
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                {evalResult.prerequisites_satisfied ? 'ELIGIBLE FOR SELF-HEALING' : 'RECOVERY BLOCKED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-soc-card border border-soc-border space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {breakdown.clean_window_satisfied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>1. 5-Minute Clean Window</span>
                </div>
                <p className="text-soc-dim text-[11px]">{breakdown.clean_window_details}</p>
              </div>

              <div className="p-2.5 rounded bg-soc-card border border-soc-border space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {breakdown.trust_score_satisfied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>2. Device Trust Score (&ge; 80)</span>
                </div>
                <p className="text-soc-dim text-[11px]">{breakdown.trust_score_details}</p>
              </div>

              <div className="p-2.5 rounded bg-soc-card border border-soc-border space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {breakdown.behavior_risk_satisfied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>3. Behavior Risk Score (&lt; 70)</span>
                </div>
                <p className="text-soc-dim text-[11px]">{breakdown.behavior_risk_details}</p>
              </div>

              <div className="p-2.5 rounded bg-soc-card border border-soc-border space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {breakdown.repeat_policy_satisfied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span>4. Repeat Offender Compliance</span>
                </div>
                <p className="text-soc-dim text-[11px]">{breakdown.repeat_policy_details}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Plans Table */}
      <div className="bg-soc-card border border-soc-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-soc-bg/90 border-b border-soc-border text-soc-dim text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3">Plan ID</th>
                <th className="py-2.5 px-3">Candidate Entity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Prerequisites</th>
                <th className="py-2.5 px-3">Verified Health</th>
                <th className="py-2.5 px-3">Recovery Latency</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {plans.length > 0 ? (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{p.id}</td>
                    <td className="py-2 px-3 font-bold">{p.entity_id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'RECOVERED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : p.status === 'BLOCKED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {p.prerequisites_satisfied ? (
                        <span className="text-emerald-400 font-bold">Passed</span>
                      ) : (
                        <span className="text-rose-400">Failed / Blocked</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {p.verified ? (
                        <span className="text-emerald-400">Telemetry Verified</span>
                      ) : (
                        <span className="text-soc-dim">Pending</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-soc-dim">
                      {p.recovery_time_seconds !== null && p.recovery_time_seconds !== undefined
                        ? `${p.recovery_time_seconds.toFixed(2)}s`
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(p.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-soc-dim">
                    No self-healing recovery cycles initiated yet.
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
