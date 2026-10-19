# Testing Guide

The framework includes comprehensive test coverage spanning unit, integration, and end-to-end policy lifecycles.

## Running Tests

From the `backend/` directory, run the repository test runner:

```bash
python run_tests.py
```

The runner configures a disposable SQLite database before importing the API application, initializes its schema, runs pytest, disposes the database engine, and removes its temporary directory. This prevents the API and capture integration tests from writing to the project's persistent `data/adaptive_zero_trust.db`.

Do not replace this with `pytest tests/` when you need to preserve the persistent application database: API integration tests use the configured application session and create scenario, settings, and packet records.

Check the frontend TypeScript and production bundle separately:

```bash
cd ../frontend
npm run build
```

## Test Suites

1. `tests/test_packet_parsing.py`:
   - Validates IPv4 header extraction (src IP, dst IP, ports, protocol, length, TTL).
   - Validates IPv6 header parsing and hop limits.
   - Validates ARP protocol specific field extraction (opcode, sender MAC, sender IP, target MAC, target IP).
   - Validates DNS feature and query/response extraction.

2. `tests/test_detection_rules.py`:
   - Phishing: Typosquatting character substitution, punycode IDN homographs, benign domain verification.
   - ARP Spoofing: Baseline conflict detection, default gateway impersonation (MITM).
   - DNS Spoofing: Conflicting IP responses from different resolvers, anomalously low TTLs.

3. `tests/test_trust_and_policies.py`:
   - Dynamic Trust: Score penalty deduction, state bands (80-100: TRUSTED, 60-79: MONITOR, 30-59: RESTRICT, 0-29: ISOLATE), penalty idempotency.
   - Zero Trust Policy Matrix: ALLOW, MONITOR, RESTRICT, ISOLATE, behavior-risk score >= 70 isolation override.
   - Repeat Offender: Multi-stage escalation (ACTIVE -> ENHANCED_MONITORING -> EXTENDED_QUARANTINE -> PERMANENT_BLOCK).

4. `tests/test_response_and_self_healing.py`:
   - Isolation & Release response actions.
   - Self-healing prerequisite verification:
     - Blocked when a malicious event occurred within previous 5 minutes.
     - Blocked when entity is in PERMANENT_BLOCK status.
     - Permitted when all 4 conditions are satisfied.
     - Simulated local recovery state update; external network health is explicitly unverified.

5. `tests/test_api_endpoints.py`:
   - Health check, diagnostics, interface discovery.
   - Capture lifecycle start/stop/status.
   - Controlled scenario runner execution.
   - System settings read/update persistence.
6. `tests/test_capture_integration.py`:
   - Offline replay while live capture is idle, upload-size limit, capture startup failure, controlled-lab gating, bounded capture inputs, interface permission wording, and TShark field parsing.

## Verification Scope

- Backend/API integration suite: 37 tests.
- Frontend: TypeScript check and production build; there is no configured frontend unit-test runner.
- Browser smoke checks in this verification: Overview loaded; a controlled phishing scenario was persisted in a temporary database; the Investigation Center rendered its linked packet/trust/policy timeline; and the Isolation & Response page rendered a non-mutating preview. This did not constitute a full cross-browser or responsive viewport test.
- Offline replay: automated upload lifecycle tests use a mocked replay callback to verify persistence, limits, failure reporting, and cleanup. A real TShark/Scapy PCAP replay was not verified in this environment.
- Live capture: not attempted. Interface discovery did not expose a loopback-only adapter, and capturing on a physical adapter could collect unrelated user traffic. Npcap/TShark detection does not establish that capture permissions work.
- Network enforcement: not tested or enabled. Response and recovery workflows are simulated and unverified.

The latest backend run completed with 37 passed and one Starlette/AnyIO deprecation warning. The frontend production build completed successfully; Vite reported a main JavaScript chunk larger than its 500 KB advisory threshold.
