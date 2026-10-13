# Adaptive Zero Trust

**Self-Healing Adaptive Zero Trust Network Security Framework for Phishing and Spoofing Attack Detection Using Dynamic Trust Scoring, Autonomous Honeypot Deployment, and Intelligent Traffic Isolation.**

*Tagline: Real-Time Network Threat Detection, Dynamic Trust and Intelligent Response.*

---

## 1. Executive Summary

Adaptive Zero Trust is an enterprise-grade Security Operations Center (SOC) framework that couples real-time packet inspection (via Wireshark/TShark and Scapy) with an explainable 0–100 Dynamic Trust Scoring algorithm, continuous behavior-risk indexing, autonomous honeypot decoys, and a 4-point verifiable self-healing recovery engine.

Unlike static rule engines or generic admin dashboards, this platform continuously evaluates incoming Layer 2, Layer 3, and Layer 4 packet telemetry, enforces Zero Trust network boundaries (ALLOW, MONITOR, RESTRICT, ISOLATE), and maintains a persistent SQLite forensic record surviving system restarts.

---

## 2. Architecture & Pipeline

```text
[Network Interface / PCAP Trace]
              │
              ▼
   [TShark / Scapy Packet Decoder]
              │
              ▼
    [Packet Normalization Engine] ──► IPv4 / IPv6 / ARP / DNS / TCP / UDP
              │
              ├───────────────────────────────┐
              ▼                               ▼
    [Threat Detection Engine]         [Flow Aggregator]
    • Phishing (Typosquat / DGA)              │
    • ARP Spoofing / Gateway MITM             ▼
    • DNS Spoofing / Cache Poison     [Stateful Flows]
              │
              ▼
     [Security Events Table]
              │
              ▼
   [Dynamic Trust Engine] (0–100 Score, -2/-15/-25/-30 Penalties)
              │
              ▼
   [Behavior-Risk Analyzer] (0–100 Score, Risk >= 70 Override)
              │
              ▼
  [Zero Trust Policy Engine] (ALLOW / MONITOR / RESTRICT / ISOLATE)
              │
              ▼
  [Authorized Response Workflow] (Safe SIMULATED Mode by Default)
              │
              ▼
  [Autonomous Honeypot Decoys & Telemetry Diversion]
              │
              ▼
    [Self-Healing Recovery Engine] (4 Prerequisite Audit -> Verification)
              │
              ▼
  [Audit Trail & Real-Time SSE/WebSocket SOC Dashboard]
```

---

## 3. Four Operating Modes

| Mode | Visual Theme | Description |
|---|---|---|
| **`LIVE_CAPTURE`** | Emerald | Real-time traffic captured directly from the selected hardware network interface via TShark/Npcap. |
| **`OFFLINE_REPLAY`** | Amber | Ingestion and forensic analysis of uploaded `.pcap` or `.pcapng` packet trace files. |
| **`CONTROLLED_LAB`** | Purple | Deterministic execution of calibrated threat vectors against configured lab endpoints. |
| **`SIMULATED_TEST`** | Cyan | Synthesized realistic enterprise network traffic and threat patterns for automated testing. |

---

## 4. 21 Functional SOC Pages

1. **Overview**: Executive SOC dashboard with KPIs, severity bar chart, trust state pie chart, recent incidents.
2. **Live Packet Monitor**: Real-time packet telemetry with authentic source/dest IPs, pause/resume, search/filtering, CSV/JSON export, packet drawer, and privacy masking.
3. **Network Flows**: Stateful 5-tuple bidirectional session table tracking volumes, durations, and linked threats.
4. **Threat Detection**: Deep incident analysis with confidence ratings, forensic evidence logs, and case escalation.
5. **Investigation Center**: Forensic case management with analyst notes, priority levels, and closure workflows.
6. **Device Trust**: Dynamic 0–100 trust scores, behavior-risk indexes, score penalty breakdowns, and audit modal.
7. **Zero Trust Decisions**: Policy engine decision log (ALLOW, MONITOR, RESTRICT, ISOLATE) with justification telemetry.
8. **Repeat Offenders**: 4-level recurrence tracker (ACTIVE -> ENHANCED_MONITORING -> EXTENDED_QUARANTINE -> PERMANENT_BLOCK).
9. **Isolation & Response**: Containment orders, quarantine management, and simulated/authorized lab execution.
10. **Self-Healing Engine**: 4-point prerequisite audit (clean window, trust >= 80, risk < 70, repeat compliance), plan generation, and verified telemetry restoration.
11. **Honeypot Monitoring**: Active decoys (HTTP Phishing Trap, SSH Bastion, DNS Sinkhole, Telnet Switch) and attacker interaction logs.
12. **Response Audit Trail**: Persistent chronicle of all containment orders, policy updates, and recovery actions.
13. **Controlled Testing**: Interactive test runner for Benign traffic, Phishing, ARP Spoof, DNS Poison, and Self-Healing.
14. **Scenario Results**: Expected vs actual outcome verification ledger.
15. **Network Topology**: Interactive node map distinguishing Configured Gateways, Discovered Hosts, and Decoys.
16. **Reports & Analytics**: Protocol distribution, incident breakdown, and exportable JSON/PDF reports.
17. **Network Interfaces**: Adapter discovery, IPv4/IPv6 addresses, MACs, Npcap driver diagnostics, and selection.
18. **Capture Sessions**: Historical capture session metadata and PCAP file upload.
19. **Diagnostics**: Real-time validation of TShark binaries, Npcap drivers, Scapy, SQLite database, and capture health.
20. **Settings**: Configurable trust penalties, risk thresholds, recovery cooldowns, and privacy masking.
21. **Documentation**: Full architectural specifications, API endpoints, setup guide, and runbook.

---

## 5. Technology Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic v2, Scapy, TShark.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Enterprise Dark SOC Design System), Lucide Icons, Recharts, Server-Sent Events (SSE).
- **Testing**: Pytest (24 automated tests).

---

## 6. Quick Start Guide

### Step 1: Start Backend Server

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API available at: `http://127.0.0.1:8000`*
*Swagger API Docs: `http://127.0.0.1:8000/docs`*

### Step 2: Start Frontend Server

```bash
cd frontend
npm run dev
```
*Frontend SOC Web App available at: `http://localhost:5173`*

### Step 3: Run Automated Test Suite

```bash
cd backend
pytest tests/ -v
```

---

## 7. License

Built for enterprise cybersecurity operations and network security research.
