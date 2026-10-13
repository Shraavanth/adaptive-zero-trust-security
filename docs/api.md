# REST API Reference

The Adaptive Zero Trust backend exposes comprehensive, documented REST endpoints and an SSE streaming channel:

### 1. Health & Diagnostics
- `GET /api/health`: Health status, app name, version.
- `GET /api/diagnostics`: Hardware adapter status, TShark version/path, Npcap drivers, SQLite status, packet record counts.

### 2. Packet Capture & Management
- `GET /api/capture/interfaces`: Discovers network adapters, MACs, IPv4/IPv6 addresses, eligibility.
- `POST /api/capture/start`: Starts packet capture session (`LIVE_CAPTURE`, `OFFLINE_REPLAY`, `CONTROLLED_LAB`, `SIMULATED_TEST`).
- `POST /api/capture/stop`: Gracefully stops active capture.
- `GET /api/capture/status`: Current session state, traffic rate, interface.
- `GET /api/capture/sessions`: Historical capture runs.
- `POST /api/capture/upload-pcap`: Uploads `.pcap` or `.pcapng` file for offline replay.

### 3. Packets & Flows
- `GET /api/packets`: Filterable, searchable, paginated packet records.
- `GET /api/packets/{id}`: Detailed packet dissection.
- `GET /api/packets/export/data?format=csv|json`: Export captured traces.
- `GET /api/flows`: Stateful 5-tuple bidirectional network flow sessions.

### 4. Threats & Investigations
- `GET /api/threats`: Security events by category, severity, status.
- `GET /api/threats/{id}`: Detailed threat forensics and evidence.
- `PATCH /api/threats/{id}/status`: Update event status.
- `GET /api/investigations`: List analyst investigation cases.
- `POST /api/investigations`: Escalate event into a formal case.
- `PATCH /api/investigations/{id}`: Update investigation notes or close case.

### 5. Dynamic Trust & Policy
- `GET /api/trust`: List device trust scores (0–100) and risk indexes (0–100).
- `GET /api/trust/{entity_id}/history`: Chronological score penalty audit log.
- `GET /api/policies/decisions`: Zero Trust policy decisions (ALLOW, MONITOR, RESTRICT, ISOLATE).
- `GET /api/policies/repeat-offenders`: Repeat offender multi-stage escalation tracker.

### 6. Response & Self-Healing
- `GET /api/response/actions`: Executed containment orders.
- `GET /api/response/isolations`: Active host quarantines.
- `POST /api/response/execute`: Dispatch containment action (ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE).
- `GET /api/honeypots`: Autonomous decoys and listener statuses.
- `GET /api/honeypots/events`: Adversary decoy interaction events.
- `GET /api/self-healing/plans`: Recovery plans.
- `POST /api/self-healing/evaluate`: Audit 4 recovery prerequisites.
- `POST /api/self-healing/execute`: Execute autonomous quarantine recovery.

### 7. Real-Time Streaming
- `GET /api/events/stream`: Server-Sent Events (SSE) streaming live packets and threat alerts.
