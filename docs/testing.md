# Testing Guide

The framework includes comprehensive test coverage spanning unit, integration, and end-to-end policy lifecycles.

## Running Tests

From the `backend/` directory:

```bash
pytest tests/ -v
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
     - Execution and verification of post-recovery state.

5. `tests/test_api_endpoints.py`:
   - Health check, diagnostics, interface discovery.
   - Capture lifecycle start/stop/status.
   - Controlled scenario runner execution.
   - System settings read/update persistence.
