# Adaptive Zero Trust — Workspace Audit

## Scope and preservation

This audit was performed against the open workspace on 2026-10-19. The worktree already contained uncommitted edits across the backend, frontend, tests, scripts, and documentation before implementation began. Those changes were treated as user work and preserved. The existing SQLite database was not modified by the baseline checks; the backend test runner uses a disposable database.

## Baseline results

| Check | Result |
|---|---|
| Backend tests (`python backend\run_tests.py`) | **Passed:** 35 tests; one upstream Starlette/AnyIO deprecation warning |
| Frontend (`npm run build` from `frontend\`) | **Passed:** TypeScript check and Vite production build |
| Frontend bundle advisory | Main minified JS chunk is 703.79 kB, above Vite's 500 kB advisory threshold |
| Live packet capture | Not attempted; requires local TShark/Scapy, Npcap and suitable capture permissions |
| Network enforcement | Not implemented or enabled; response operations are simulated |

## What works in the inspected implementation

- FastAPI application registers health, capture, packet, flow, detection, investigation, trust, policy, response, honeypot, self-healing, audit, topology, testing, report, and settings APIs.
- SQLite/SQLAlchemy persistence covers capture sessions, packet records, events, flows, trust history, policy decisions, investigations, response actions, honeypot records, self-healing plans, scenarios, and audit logs.
- Packet normalization and the tested parsers cover IPv4, IPv6, ARP, DNS and transport metadata.
- Detection has phishing, ARP spoofing, DNS spoofing, and SYN port-scan logic; trust penalties, behavior risk, Zero Trust decisions, repeat-offender escalation, and simulated response are called from the packet pipeline.
- PCAP uploads are extension-checked, size-limited, replayed separately from live capture, and temporary files are cleaned up.
- Continuous capture start failures are surfaced; capture permission is not inferred from adapter discovery.
- The frontend routes all 21 requested page areas and includes API-backed views, SSE packet updates, filters, responsive navigation, and a consistent dark SOC theme.
- Honeypot entries are seeded records, not active network listeners. Self-healing and response documentation correctly distinguishes local simulated state from externally verified action.

## Gaps and risks found

1. **Incident evidence is not assembled into a case timeline.** Events are stored before their packet rows, leaving `SecurityEvent.related_packet_id` unset in the normal pipeline. The packet stores `related_event_id`, but investigations have no API that joins it to packet, trust history, decision, and response records. The UI can therefore show case notes and an event reference but not a verified, linked evidence chain.
2. **No response dry-run/preview endpoint.** Response actions are correctly simulated, but operators cannot request a read-only preview of the proposed action, affected local records, and rollback limits before recording it.
3. **API lifecycle tests do not exercise actual live capture.** They exercise safe simulated operation and mocked failure cases. Npcap/TShark presence and permissions remain environment-dependent.
4. **No configured frontend unit or component test runner.** TypeScript and Vite build checks validate compilation, not browser interaction behavior.
5. **Bundle size advisory.** The production JavaScript bundle exceeds Vite's default warning threshold; page-level code splitting may improve initial load time.
6. **Application security boundary.** API has no authentication/authorization; README and security docs warn to keep it on localhost. It must not be exposed to untrusted networks.
7. **Behavior-risk historical scope.** Risk calculation queries all events for an entity without a time window. This is explainable but can allow old incidents to influence current risk indefinitely.
8. **Some frontend views handle load errors only in console logs.** A production-facing per-page error/empty/loading treatment is inconsistent, even though the app shell reports backend status errors.
9. **Repeat-offender updates were not idempotent.** The count had no event-id ledger, so retrying the same detection through the escalation service could increment the same incident more than once. An additive event ledger now deduplicates by event ID without deleting or rewriting existing counts.

## Prioritized improvements

- Add an event-linked investigation evidence endpoint that returns persisted packet, trust changes, policy decisions, response actions, and a timestamp-ordered timeline without synthetic evidence.
- Add a safe response preview that explicitly states it is non-mutating, simulated-only, and cannot promise rollback of real network controls.
- Deduplicate repeat-offender escalation using persisted security event IDs.
- Test all three improvements against the disposable database, then surface the evidence chain and preview in the existing SOC UI.
- Consider a bounded behavior-risk history window, frontend interaction tests, and lazy-loaded page bundles as later work.
