# Adaptive Zero Trust

**Adaptive Zero Trust monitoring and analysis framework for phishing and spoofing detection, dynamic trust scoring, and simulated response workflows.**

*Tagline: Real-Time Network Threat Detection, Dynamic Trust and Intelligent Response.*

---

## 1. Executive Summary

Adaptive Zero Trust is a local Security Operations Center (SOC) application that combines optional live packet capture (Wireshark/TShark or Scapy) and offline PCAP replay with phishing, ARP, and DNS spoofing detection, explainable 0–100 trust scoring, and behavior-risk analysis. Response, isolation, and recovery actions update local records in simulated mode only.

The application records Zero Trust policy decisions (ALLOW, MONITOR, RESTRICT, ISOLATE) and packet analysis in SQLite. It does not enforce network boundaries, start honeypot listeners, or verify external recovery.

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
  [Local Response Recorder] (SIMULATED only; no network enforcement)
              │
              ▼
  [Seeded Honeypot Records] (no listeners started)
              │
              ▼
    [Self-Healing Evaluator] (simulated local state; external health unverified)
              │
              ▼
  [Audit Trail & Real-Time SSE SOC Dashboard]
```

---

## 3. Four Operating Modes

| Mode | Visual Theme | Description |
|---|---|---|
| **`LIVE_CAPTURE`** | Emerald | Real-time traffic captured directly from the selected hardware network interface via TShark/Npcap. |
| **`OFFLINE_REPLAY`** | Amber | Ingestion and forensic analysis of uploaded `.pcap`, `.pcapng`, or `.cap` trace files. |
| **`CONTROLLED_LAB`** | Purple | Explicit synthetic test scenarios passed through detection and policy; continuous capture against lab endpoints is not configured. |
| **`SIMULATED_TEST`** | Cyan | Synthesized realistic enterprise network traffic and threat patterns for automated testing. |

---

## 4. SOC UI Pages

1. **Overview**: Executive SOC dashboard with KPIs, severity bar chart, trust state pie chart, recent incidents.
2. **Live Packet Monitor**: Real-time packet telemetry with authentic source/dest IPs, pause/resume, search/filtering, CSV/JSON export, packet drawer, and privacy masking.
3. **Network Flows**: Stateful 5-tuple bidirectional session table tracking volumes, durations, and linked threats.
4. **Threat Detection**: Deep incident analysis with confidence ratings, forensic evidence logs, and case escalation.
5. **Investigation Center**: Forensic case management with analyst notes, priority levels, and closure workflows.
6. **Device Trust**: Dynamic 0–100 trust scores, behavior-risk indexes, score penalty breakdowns, and audit modal.
7. **Zero Trust Decisions**: Policy engine decision log (ALLOW, MONITOR, RESTRICT, ISOLATE) with justification telemetry.
8. **Repeat Offenders**: 4-level recurrence tracker (ACTIVE -> ENHANCED_MONITORING -> EXTENDED_QUARANTINE -> PERMANENT_BLOCK).
9. **Isolation & Response**: Simulated response records and local quarantine state; no network enforcement.
10. **Self-Healing Engine**: Recovery prerequisite evaluation and simulated local state updates; network health is not verified.
11. **Honeypot Monitoring**: Seeded simulated decoy records; no HTTP, SSH, DNS, or Telnet listeners are started.
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

## Explainability & safe response previews

The Investigation Center loads a correlated evidence timeline from persisted event, packet, trust-history, Zero Trust decision, and response records. Missing evidence is shown as missing rather than synthesized. Repeat-offender escalation deduplicates by persisted event ID. The Isolation & Response page provides a read-only simulated-action preview, including affected local record types and an advisory inverse operation. A preview does not mutate state, enforce a network action, or guarantee rollback.

The initial workspace audit and prioritized findings are documented in [docs/audit-report.md](./docs/audit-report.md).

---

## 5. Technology Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic v2, Scapy, TShark.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Enterprise Dark SOC Design System), Lucide Icons, Recharts, Server-Sent Events (SSE).
- **Testing**: Pytest (37 automated backend tests); no frontend unit-test suite is configured.

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
python run_tests.py
```

The runner uses a disposable SQLite database and does not change `data/adaptive_zero_trust.db`.

Run the frontend TypeScript check and production build:

```bash
cd frontend
npm run build
```

The backend has no authentication or authorization. Keep it bound to localhost and do not expose it to untrusted networks. See [docs/security.md](./docs/security.md) before use.

---

## 7. License

Built for enterprise cybersecurity operations and network security research.
