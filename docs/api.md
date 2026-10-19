# REST API Reference

The Adaptive Zero Trust backend exposes comprehensive, documented REST endpoints and an SSE streaming channel:

### 1. Health & Diagnostics
- `GET /api/health`: Health status, app name, version.
- `GET /api/diagnostics`: Hardware adapter status, TShark version/path, Npcap drivers, SQLite status, packet record counts.

### 2. Packet Capture & Management
- `GET /api/capture/interfaces`: Discovers network adapters, MACs, IPv4/IPv6 addresses, eligibility.
- `POST /api/capture/start`: Starts live capture (`LIVE_CAPTURE`) or synthetic traffic (`SIMULATED_TEST`). `CONTROLLED_LAB` is scenario-driven and cannot start continuous capture until lab endpoints are configured; use `/api/testing/run-scenario`. Offline replay uses `/api/capture/upload-pcap`.
- `POST /api/capture/stop`: Gracefully stops active capture.
- `GET /api/capture/status`: Current session state, traffic rate, interface.
- `GET /api/capture/sessions`: Historical capture runs.
- `POST /api/capture/upload-pcap`: Replays `.pcap`, `.pcapng`, or `.cap` uploads (maximum 50 MB) through packet persistence and analysis, independently of live-capture state. Temporary upload files are removed after replay.

### 3. Packets & Flows
- `GET /api/packets`: Filterable, searchable, paginated packet records.
- `GET /api/packets/{id}`: Detailed packet dissection.
- `GET /api/packets/export/data?format=csv|json`: Export captured traces.
- `GET /api/flows`: Stateful 5-tuple bidirectional network flow sessions.

### 4. Threats & Investigations
- `GET /api/threats`: Security events by category, severity, status.
- `GET /api/threats/{id}`: Detailed threat forensics and evidence.
- `GET /api/threats/{id}/evidence`: Correlated, persisted event, packet, trust-history, policy, response, and timestamp-sorted timeline records. Missing related records remain absent rather than being synthesized.
- `PATCH /api/threats/{id}/status`: Update event status.
- `GET /api/investigations`: List analyst investigation cases.
- `POST /api/investigations`: Escalate event into a formal case.
- `PATCH /api/investigations/{id}`: Update investigation notes or close case.

### 5. Dynamic Trust & Policy
- `GET /api/trust`: List device trust scores (0–100) and risk indexes (0–100).
- `GET /api/trust/{entity_id}/history`: Chronological score penalty audit log.
- `GET /api/policies/decisions`: Zero Trust policy decisions (ALLOW, MONITOR, RESTRICT, ISOLATE).
- `GET /api/policies/repeat-offenders`: Repeat offender multi-stage escalation tracker; repeated processing of an event ID does not increment its distinct-incident count again.

### 6. Response & Self-Healing
- `GET /api/response/actions`: Executed containment orders.
- `GET /api/response/isolations`: Active host quarantines.
- `POST /api/response/preview`: Read-only action preview with affected local record types and a suggested inverse operation. It does not reserve, create, or change records or network controls; the inverse is not a guaranteed rollback.
- `POST /api/response/execute`: Records a simulated action (ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE). Real network enforcement is not implemented; only `SIMULATED` mode is accepted.
- `GET /api/honeypots`: Autonomous decoys and listener statuses.
- `GET /api/honeypots/events`: Adversary decoy interaction events.
- `GET /api/self-healing/plans`: Recovery plans.
- `POST /api/self-healing/evaluate`: Audit 4 recovery prerequisites.
- `POST /api/self-healing/execute`: Apply a simulated local recovery-state update when prerequisites pass. Network policy and host connectivity are not modified or verified.

### 7. Real-Time Streaming
- `GET /api/events/stream`: Server-Sent Events (SSE) streaming live packets and threat alerts.

Controlled scenario results are marked `PASSED` only when the expected packet classification and associated persisted event, trust history, and policy decision are observed. Response side effects remain simulated.
