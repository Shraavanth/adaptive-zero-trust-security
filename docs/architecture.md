# System Architecture

## Self-Healing Adaptive Zero Trust Network Security Framework

### 1. High-Level Pipeline

The architecture follows a strict, unidirectional processing and evaluation pipeline:

```text
[Network NIC / PCAP Ingestion]
               │
               ▼
   [TShark / Scapy Packet Decoder]
               │
               ▼
      [Packet Normalizer]  ──► (IPv4, IPv6, ARP, DNS, TCP/UDP metadata)
               │
               ├─────────────────────────────────┐
               ▼                                 ▼
   [Threat Detection Engine]             [Flow Aggregator]
   (Phishing, ARP Spoof, DNS Spoof)              │
               │                                 ▼
               ▼                         [NetworkFlows Table]
       [Security Events]
               │
               ▼
     [Dynamic Trust Engine] (0–100 Trust Score with -2, -15, -25, -30 penalties)
               │
               ▼
    [Behavior-Risk Analyzer] (0–100 Risk Score, >=70 trigger)
               │
               ▼
    [Zero Trust Policy Engine] (ALLOW / MONITOR / RESTRICT / ISOLATE)
               │
               ▼
   [Response State Recorder] (SIMULATED only; no network enforcement)
               │
               ▼
 [Seeded Honeypot Records & Interaction Audit]
               │
               ▼
     [Self-Healing Engine] (4 Prerequisite Audit -> Simulated Local State Update; external health is not verified)
               │
               ▼
    [Persistent Audit Trail & Real-Time SSE SOC Dashboard]
```

### 2. Operating Modes

1. **LIVE_CAPTURE**: Binds to selected local hardware/virtual network interface using TShark or Scapy to capture actual live packet traffic.
2. **OFFLINE_REPLAY**: Ingests uploaded `.pcap` or `.pcapng` forensic traces and passes them sequentially through normalizer and detection.
3. **CONTROLLED_LAB**: Runs explicit synthetic test vectors through detection and policy persistence. No lab endpoints or network enforcement are configured; continuous lab capture is rejected.
4. **SIMULATED_TEST**: Synthesizes realistic protocol streams (HTTP, DNS, ARP) and threat vectors for automated component testing and demonstration.

### 3. Core Modules

- **Ingestion & Capture**: `backend/app/capture/` (interface manager, tshark engine, scapy engine, normalizer, offline replay, capture service).
- **Threat Detection**: `backend/app/detection/` (phishing detector, arp spoof detector, dns spoof detector, detection service).
- **Trust & Risk**: `backend/app/trust/` (trust engine, behavior risk calculator).
- **Policies & Escalation**: `backend/app/policies/` (zero trust policy engine, repeat offender tracker).
- **Response & Containment**: `backend/app/response/` (simulated response actions and isolation records; no network controls are applied).
- **Decoys**: `backend/app/honeypot/` (seeded simulated records for HTTP, SSH, DNS, and Telnet decoy concepts; no listeners are started).
- **Self-Healing**: `backend/app/self_healing/` (4-point prerequisite evaluator and simulated local state updates; no external network health verification).
- **Database & Storage**: `backend/app/database/` (SQLAlchemy, SQLite persistent database in `data/adaptive_zero_trust.db`).
- **REST & SSE API**: `backend/app/api/` (17 API routers and real-time Server-Sent Events).
- **Frontend SOC**: `frontend/src/` (Vite, React 18, TypeScript, Tailwind CSS enterprise dark theme, Recharts, 21 functional pages).

### 4. Explainability and safe response preview

The event evidence API correlates only persisted rows: the event, its related packet, trust-history entries, policy decisions, and response actions. It returns these records as a chronological incident timeline for the Investigation Center; missing evidence is not fabricated. The response preview endpoint performs database reads only and returns the local record types that a simulated action would affect, a suggested inverse action, and explicit limitations. The preview is advisory: execution remains simulated and no network policy or host state is actually changed.
