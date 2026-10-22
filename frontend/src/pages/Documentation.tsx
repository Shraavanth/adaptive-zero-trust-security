import React from 'react';
import { BookOpen, Shield, Cpu, Activity, KeyRound, HeartPulse, Terminal } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="space-y-6 font-mono text-xs max-w-5xl">
      <div className="panel p-5">
        <h2 className="text-lg font-bold text-soc-text flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Adaptive Zero Trust Network Security Framework Documentation
        </h2>
        <p className="text-soc-dim mt-1 text-xs">
          Comprehensive Architectural Specifications, Detection Algorithms, Pipeline Protocols, and Runbook.
        </p>
      </div>

      {/* Architecture Pipeline */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-soc-text uppercase tracking-wider flex items-center gap-2 border-b border-soc-border pb-2">
          <Activity className="w-4 h-4 text-emerald-400" /> 1. Core End-to-End Security Architecture Pipeline
        </h3>
        <div className="bg-soc-bg rounded p-4 border border-soc-border text-soc-muted space-y-2 text-[11px] leading-relaxed">
          <p className="font-bold text-soc-text">The framework implements an unbroken, explainable defensive pipeline:</p>
          <div className="p-3 bg-soc-card rounded border border-soc-border text-blue-300 font-bold space-y-1">
            <p>1. Network Adapter or PCAP File Ingestion</p>
            <p>2. TShark Decoupled Subprocess / Scapy Async Sniffing Engine</p>
            <p>3. Normalization into Validated L2/L3/L4 Metadata Schemas</p>
            <p>4. Algorithmic Detection: Phishing (Lookalike/DGA), ARP Poisoning, DNS Spoofing</p>
            <p>5. Persistent Storage in Local SQLite Database</p>
            <p>6. Dynamic Trust Scoring (0–100) & Behavior Risk Calculation (0–100)</p>
            <p>7. Zero Trust Policy Decision: ALLOW / MONITOR / RESTRICT / ISOLATE</p>
            <p>8. Authorized Containment Execution (Default: Safe SIMULATED Mode)</p>
            <p>9. Autonomous Honeypot Deployment & Telemetry Diversion</p>
            <p>10. Autonomous Self-Healing Prerequisite Audit & Recovery Execution</p>
            <p>11. Immutable Audit Trail & Real-time SSE / WebSocket UI Telemetry</p>
          </div>
        </div>
      </div>

      {/* Detection Modules */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-soc-text uppercase tracking-wider flex items-center gap-2 border-b border-soc-border pb-2">
          <Shield className="w-4 h-4 text-rose-400" /> 2. Threat Detection Engines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 inset-well space-y-1.5">
            <h4 className="font-bold text-rose-400">Phishing Detection</h4>
            <p className="text-soc-dim">
              Detects typosquatting via character-substitution patterns (e.g. paypa1, micros0ft), punycode homographs (xn--), suspicious TLDs paired with credential terms, and Shannon entropy DGA algorithms.
            </p>
            <span className="block text-amber-400 font-bold">Penalty: -15 Trust Points</span>
          </div>

          <div className="p-3 inset-well space-y-1.5">
            <h4 className="font-bold text-orange-400">ARP Spoofing & MITM</h4>
            <p className="text-soc-dim">
              Maintains an active IP-to-MAC baseline table. Detects conflicting MAC announcements for the default gateway or existing hosts, and flags gratuitous preemption broadcasts.
            </p>
            <span className="block text-rose-400 font-bold">Penalty: -30 Trust Points</span>
          </div>

          <div className="p-3 inset-well space-y-1.5">
            <h4 className="font-bold text-cyan-400">DNS Spoofing & Poisoning</h4>
            <p className="text-soc-dim">
              Monitors DNS answer consistency within 60s windows. Intercepts conflicting IP resolutions for the same query, near-zero TTL fast-flux injections, and responses from rogue resolvers.
            </p>
            <span className="block text-rose-400 font-bold">Penalty: -25 Trust Points</span>
          </div>
        </div>
      </div>

      {/* Four Operating Modes */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-soc-text uppercase tracking-wider flex items-center gap-2 border-b border-soc-border pb-2">
          <Cpu className="w-4 h-4 text-purple-400" /> 3. Visibly Distinct Operating Modes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 inset-well space-y-1">
            <span className="font-bold text-emerald-400">LIVE_CAPTURE</span>
            <p className="text-soc-dim">
              Streams packets directly from the selected hardware NIC (Wi-Fi or Ethernet) using TShark/Npcap.
            </p>
          </div>
          <div className="p-3 inset-well space-y-1">
            <span className="font-bold text-amber-400">OFFLINE_REPLAY</span>
            <p className="text-soc-dim">
              Parses uploaded .pcap or .pcapng files, executing the entire detection pipeline against recorded packet traces.
            </p>
          </div>
          <div className="p-3 inset-well space-y-1">
            <span className="font-bold text-purple-400">CONTROLLED_LAB</span>
            <p className="text-soc-dim">
              Runs approved deterministic attack vectors from the Controlled Testing suite against configured lab systems.
            </p>
          </div>
          <div className="p-3 inset-well space-y-1">
            <span className="font-bold text-cyan-400">SIMULATED_TEST</span>
            <p className="text-soc-dim">
              Synthesizes realistic network traffic patterns for UI component testing, demonstrations, and operator onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Self Healing Prerequisites */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-soc-text uppercase tracking-wider flex items-center gap-2 border-b border-soc-border pb-2">
          <HeartPulse className="w-4 h-4 text-emerald-400" /> 4. Self-Healing Prerequisites
        </h3>
        <div className="p-3 inset-well text-soc-muted space-y-1 text-[11px]">
          <p className="font-bold text-soc-text">To execute automated recovery without human intervention, all four conditions must be met:</p>
          <ul className="list-disc pl-5 space-y-1 text-soc-dim">
            <li><span className="text-soc-text font-bold">Clean Cooldown Window:</span> No malicious events detected from the host within the previous 5 minutes (300 seconds).</li>
            <li><span className="text-soc-text font-bold">Trust Score Threshold:</span> Entity trust score must be restored or evaluated at &ge; 80 points.</li>
            <li><span className="text-soc-text font-bold">Behavior Risk Threshold:</span> Cumulative behavior-risk score must be below 70 points.</li>
            <li><span className="text-soc-text font-bold">Repeat Offender Policy:</span> Entity must not be marked as PERMANENT_BLOCK (Level 4 escalation).</li>
          </ul>
        </div>
      </div>

      {/* Runbook & Commands */}
      <div className="panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-soc-text uppercase tracking-wider flex items-center gap-2 border-b border-soc-border pb-2">
          <Terminal className="w-4 h-4 text-blue-400" /> 5. Local Startup & Execution Commands
        </h3>
        <div className="inset-well p-3 space-y-2 text-[11px]">
          <p className="text-soc-dim">Start Backend Server:</p>
          <pre className="p-2 bg-slate-950 rounded text-emerald-400 font-bold overflow-x-auto">
            cd backend&#10;uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
          </pre>
          <p className="text-soc-dim mt-2">Start Frontend Development Server:</p>
          <pre className="p-2 bg-slate-950 rounded text-cyan-400 font-bold overflow-x-auto">
            cd frontend&#10;npm run dev
          </pre>
          <p className="text-soc-dim mt-2">Execute Automated Pytest Suite:</p>
          <pre className="p-2 bg-slate-950 rounded text-amber-400 font-bold overflow-x-auto">
            cd backend&#10;pytest tests/ -v
          </pre>
        </div>
      </div>
    </div>
  );
};
