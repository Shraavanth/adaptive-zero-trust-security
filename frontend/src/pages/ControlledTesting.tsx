import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle2, ShieldAlert, Cpu, Check, Radio, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ScenarioResult } from '../types';

export const ControlledTesting: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [targetIp, setTargetIp] = useState('192.168.1.188');
  const [lastResult, setLastResult] = useState<ScenarioResult | null>(null);

  const testSuites = [
    {
      id: 'BENIGN_TRAFFIC',
      name: 'Benign Protocol Traffic Baseline',
      desc: 'Dispatches standard clean HTTP/DNS queries. Validates zero false positives and preserves 100 trust score.',
      expected: 'Packet ingested as CLEAN; trust score preserved at 100; ALLOW policy maintained.',
      badgeColor: 'blue'
    },
    {
      id: 'PHISHING_ATTACK',
      name: 'Phishing Lookalike / Typosquat Domain',
      desc: 'Injects query for "paypa1-secure-login.com". Triggers PHISH-RULE-003-TYPOSQUAT and applies -15 trust penalty.',
      expected: 'Detected as PHISHING; trust penalized to 85; RESTRICT boundary activated.',
      badgeColor: 'amber'
    },
    {
      id: 'ARP_SPOOF_ATTACK',
      name: 'ARP Spoofing & Gateway Impersonation (MITM)',
      desc: 'Broadcasts conflicting ARP reply for default gateway 192.168.1.1 with rogue MAC ba:ad:f0:0d:99:11. Triggers -30 penalty.',
      expected: 'Detected as ARP_SPOOFING; trust depleted to 70; immediate ISOLATION enforced.',
      badgeColor: 'rose'
    },
    {
      id: 'DNS_SPOOF_ATTACK',
      name: 'DNS Cache Poisoning & Conflicting Answers',
      desc: 'Simulates conflicting DNS resolution from unauthorized internal IP with low TTL (1s). Triggers -25 penalty.',
      expected: 'Detected as DNS_SPOOFING; trust score penalized; containment policy enacted.',
      badgeColor: 'rose'
    },
    {
      id: 'SELF_HEALING_LIFECYCLE',
      name: 'Autonomous Self-Healing Verification Cycle',
      desc: 'Verifies 4 prerequisites for isolated host, generates recovery plan, releases quarantine ACLs, verifies telemetry flow.',
      expected: 'Prerequisites verified; quarantine released; verification passed in < 0.5s.',
      badgeColor: 'emerald'
    }
  ];

  const handleRun = async (scenarioId: string) => {
    setRunningId(scenarioId);
    setLastResult(null);
    try {
      const res = await api.runScenario(scenarioId, targetIp);
      setLastResult(res);
    } catch (err) {
      alert(`Scenario execution failed: ${err}`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            Controlled Cyber Lab & Attack Simulation Suite
          </h2>
          <p className="text-soc-dim mt-0.5">
            Safely execute calibrated threat vectors against configured lab endpoints to validate end-to-end Zero Trust pipelines.
          </p>
        </div>
        <button
          onClick={() => onNavigate('scenario-results')}
          className="btn-ghost"
        >
          View All Historical Results →
        </button>
      </div>

      {/* Target Config */}
      <div className="panel p-4 flex items-center gap-3">
        <span className="text-soc-dim">TARGET LAB ENDPOINT:</span>
        <input
          type="text"
          value={targetIp}
          onChange={(e) => setTargetIp(e.target.value)}
          className="inset-well px-3 py-1 text-soc-text w-48 focus:outline-none focus:border-blue-500"
        />
        <span className="text-[11px] text-soc-dim">
          Traffic will be simulated in CONTROLLED_LAB mode with zero risk to production network.
        </span>
      </div>

      {/* Scenario Execution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testSuites.map((s) => {
          const isRunning = runningId === s.id;
          return (
            <div key={s.id} className="panel p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400">{s.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                    CONTROLLED_LAB
                  </span>
                </div>
                <h3 className="font-bold text-soc-text text-sm mt-1">{s.name}</h3>
                <p className="text-soc-dim text-[11px] mt-1 leading-relaxed">{s.desc}</p>
                <div className="mt-2 p-2 inset-well text-[11px] text-soc-muted">
                  <span className="text-soc-dim font-bold">Expected: </span>
                  {s.expected}
                </div>
              </div>

              <button
                onClick={() => handleRun(s.id)}
                disabled={isRunning}
                className="w-full py-2 px-3 rounded btn-signal font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isRunning
                  ? <Loader2 aria-hidden="true" className="spin w-3.5 h-3.5" />
                  : <Play aria-hidden="true" className="w-3.5 h-3.5 fill-current" />}
                {isRunning ? 'Simulating Vector...' : 'Execute Controlled Test'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution Feedback Banner */}
      {lastResult && (
        <div key={lastResult.scenario_name + lastResult.duration_ms} className="success-pop p-4 bg-soc-card border border-emerald-800/80 rounded-lg space-y-2">
          <div className="flex items-center justify-between border-b border-soc-border pb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="check-draw w-4 h-4 text-emerald-400" />
              Scenario Execution Passed: {lastResult.scenario_name}
            </span>
            <span className="text-soc-dim">Duration: {lastResult.duration_ms.toFixed(1)} ms</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <p><span className="text-soc-dim">Expected:</span> <span className="text-soc-muted">{lastResult.expected_outcome}</span></p>
            <p><span className="text-soc-dim">Actual:</span> <span className="text-emerald-300 font-bold">{lastResult.actual_outcome}</span></p>
          </div>
          {lastResult.details && (
            <p className="text-[11px] text-soc-dim pt-1 border-t border-soc-border">
              Forensic Details: {lastResult.details}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
