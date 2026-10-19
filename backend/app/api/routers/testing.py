import uuid
import time
import datetime
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from ipaddress import ip_address
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.scenario import ScenarioResult
from app.models.detection import SecurityEvent
from app.models.policy import ZeroTrustDecision
from app.models.trust import TrustHistory
from app.schemas import ScenarioResultSchema
from app.capture.capture_service import capture_service
from app.self_healing.self_healing_engine import generate_and_execute_recovery_plan
from app.core.config import settings

router = APIRouter(prefix="/api/testing", tags=["Controlled Testing & Scenarios"])

class RunScenarioRequest(BaseModel):
    scenario_id: str
    target_ip: str = "192.168.1.188"

@router.get("/results", response_model=List[ScenarioResultSchema])
def list_scenario_results(db: Session = Depends(get_db)):
    return db.query(ScenarioResult).order_by(ScenarioResult.timestamp.desc()).all()

@router.post("/run-scenario", response_model=ScenarioResultSchema)
def run_scenario(req: RunScenarioRequest, db: Session = Depends(get_db)):
    start_time = time.perf_counter()
    res_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.datetime.utcnow()

    sid = req.scenario_id.upper()
    try:
        target = str(ip_address(req.target_ip))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="target_ip must be a valid IPv4 or IPv6 address.") from exc

    if sid == "SELF_HEALING_LIFECYCLE":
        expected = "Recovery prerequisites pass and the local recovery state is updated in SIMULATED mode."
        plan = generate_and_execute_recovery_plan(
            db,
            target,
            auto_execute=settings.AUTO_HEALING_ENABLED
        )
        status = "PASSED" if plan.status == "SIMULATED" and not plan.verified else "FAILED"
        actual = (
            f"Recovery plan status: {plan.status}; prerequisites: {plan.prerequisites_satisfied}; "
            f"network verification: {plan.verified}."
        )
        details = plan.verification_details or plan.reason
        expected = expected if settings.AUTO_HEALING_ENABLED else "Recovery prerequisites are evaluated; automatic state update is disabled."
        if not settings.AUTO_HEALING_ENABLED and plan.status == "ELIGIBLE":
            status = "PASSED"
    elif sid in ("BENIGN_TRAFFIC", "PHISHING_ATTACK", "ARP_SPOOF_ATTACK", "DNS_SPOOF_ATTACK"):
        scenarios = {
            "BENIGN_TRAFFIC": {
                "expected_category": None,
                "expected": "Benign DNS telemetry is persisted as CLEAN without a security event.",
                "packet": {
                    "src_ip": target, "dst_ip": "1.1.1.1", "protocol": "DNS",
                    "src_port": 51234, "dst_port": 53, "length": 68,
                    "dns_query": "wikipedia.org", "dns_reply": "208.80.154.224"
                }
            },
            "PHISHING_ATTACK": {
                "expected_category": "PHISHING",
                "expected": "Phishing is detected and a trust history entry and policy decision are persisted; any response remains simulated.",
                "packet": {
                    "src_ip": target, "dst_ip": "8.8.8.8", "protocol": "DNS",
                    "src_port": 54321, "dst_port": 53, "length": 84,
                    "dns_query": "paypa1-secure-login.com", "dns_reply": "198.51.100.22"
                }
            },
            "ARP_SPOOF_ATTACK": {
                "expected_category": "ARP_SPOOFING",
                "expected": "An unsolicited ARP announcement is detected and its event and trust history are persisted.",
                "packet": {
                    "src_ip": target, "dst_ip": target, "protocol": "ARP",
                    "arp_opcode": "reply", "arp_sender_ip": target,
                    "arp_sender_mac": ":".join(uuid.uuid4().hex[i:i + 2] for i in range(0, 12, 2)),
                    "arp_target_ip": target, "arp_target_mac": "00:00:00:00:00:00", "length": 42
                }
            },
            "DNS_SPOOF_ATTACK": {
                "expected_category": "DNS_SPOOFING",
                "expected": "A response from an unexpected local resolver is detected and its event and trust history are persisted.",
                "packet": {
                    "src_ip": "192.168.1.99", "dst_ip": target, "protocol": "DNS",
                    "src_port": 53, "dst_port": 52111, "length": 86,
                    "dns_query": "internal-bank.portal", "dns_reply": "103.21.244.0", "ttl": 1
                }
            }
        }
        scenario = scenarios[sid]
        packet = dict(scenario["packet"], timestamp=now)
        if sid == "BENIGN_TRAFFIC":
            packet["dns_query"] = f"benign-{res_id.lower()}.example"
        processed = capture_service.process_packet(
            packet,
            session_id=res_id,
            interface="SCENARIO_TEST",
            mode="CONTROLLED_LAB"
        )
        event = None
        history = None
        decision = None
        if processed["related_event_id"]:
            event = db.query(SecurityEvent).filter(
                SecurityEvent.id == processed["related_event_id"]
            ).first()
            if event:
                history = db.query(TrustHistory).filter(
                    TrustHistory.event_id == event.id
                ).first()
                decision = db.query(ZeroTrustDecision).filter(
                    ZeroTrustDecision.triggering_event_id == event.id
                ).first()

        if scenario["expected_category"] is None:
            status = "PASSED" if processed["detection_status"] == "CLEAN" and event is None else "FAILED"
            actual = f"Packet {processed['id']} classified {processed['detection_status']}."
            details = "No security event was associated with the processed packet."
        else:
            verified = (
                event is not None
                and event.category == scenario["expected_category"]
                and history is not None
                and decision is not None
            )
            status = "PASSED" if verified else "FAILED"
            if event:
                actual = (
                    f"Detected {event.category} ({event.rule_id}); "
                    f"trust penalty: {history.penalty_applied if history else 'missing'}; "
                    f"policy: {decision.decision if decision else 'missing'}."
                )
                details = event.detection_reason
            else:
                actual = f"Expected {scenario['expected_category']} detection was not persisted."
                details = "No matching security event, trust history, and policy decision were all observed."
        expected = scenario["expected"]
    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario ID: {sid}")

    duration_ms = (time.perf_counter() - start_time) * 1000

    result = ScenarioResult(
        id=res_id,
        scenario_name=sid,
        timestamp=now,
        mode="CONTROLLED_LAB",
        expected_outcome=expected,
        actual_outcome=actual,
        status=status,
        duration_ms=duration_ms,
        details=details
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
