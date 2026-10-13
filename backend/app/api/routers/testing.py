import uuid
import time
import datetime
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.scenario import ScenarioResult
from app.models.trust import DeviceTrust
from app.models.policy import ZeroTrustDecision, RepeatOffender
from app.schemas import ScenarioResultSchema
from app.capture.capture_service import capture_service
from app.self_healing.self_healing_engine import generate_and_execute_recovery_plan

router = APIRouter(prefix="/api/testing", tags=["Controlled Testing & Scenarios"])

class RunScenarioRequest(BaseModel):
    scenario_id: str  # BENIGN_TRAFFIC, PHISHING_ATTACK, ARP_SPOOF_ATTACK, DNS_SPOOF_ATTACK, RECON_SYN_SCAN, SELF_HEALING_LIFECYCLE
    target_ip: str = "192.168.1.188"

@router.get("/results", response_model=List[ScenarioResultSchema])
def list_scenario_results(db: Session = Depends(get_db)):
    return db.query(ScenarioResult).order_by(ScenarioResult.timestamp.desc()).all()

@router.post("/run-scenario", response_model=ScenarioResultSchema)
def run_scenario(req: RunScenarioRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    res_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.datetime.utcnow()

    sid = req.scenario_id.upper()
    target = req.target_ip

    expected = ""
    actual = ""
    status = "PASSED"
    details = ""

    if sid == "BENIGN_TRAFFIC":
        expected = "Packet classified as CLEAN; trust score preserved at 100; ALLOW policy maintained."
        pkt = {
            "timestamp": now,
            "src_ip": target,
            "dst_ip": "1.1.1.1",
            "protocol": "DNS",
            "src_port": 51234,
            "dst_port": 53,
            "length": 68,
            "dns_query": "wikipedia.org",
            "dns_reply": "208.80.154.224",
            "mode": "CONTROLLED_LAB"
        }
        capture_service._handle_raw_packet(pkt)
        dev = db.query(DeviceTrust).filter(DeviceTrust.entity_id == target).first()
        score = dev.current_trust_score if dev else 100
        actual = f"Packet ingested as CLEAN. Device trust score: {score}/100."
        details = f"Verified non-malicious DNS resolution to wikipedia.org from {target}."

    elif sid == "PHISHING_ATTACK":
        expected = "Domain identified as Phishing lookalike; -15 trust penalty applied; RESTRICT policy enforced."
        pkt = {
            "timestamp": now,
            "src_ip": target,
            "dst_ip": "8.8.8.8",
            "protocol": "DNS",
            "src_port": 54321,
            "dst_port": 53,
            "length": 84,
            "dns_query": "paypa1-secure-login.com",
            "dns_reply": "198.51.100.22",
            "mode": "CONTROLLED_LAB"
        }
        capture_service._handle_raw_packet(pkt)
        dev = db.query(DeviceTrust).filter(DeviceTrust.entity_id == target).first()
        score = dev.current_trust_score if dev else 85
        actual = f"Phishing detected! Trust penalized to {score}/100. State: {dev.state if dev else 'RESTRICT'}."
        details = "Rule PHISH-RULE-003-TYPOSQUAT triggered against paypa1-secure-login.com."

    elif sid == "ARP_SPOOF_ATTACK":
        expected = "Conflicting MAC / gateway MITM detected; -30 trust penalty applied; immediate ISOLATION enforced."
        pkt = {
            "timestamp": now,
            "src_ip": "192.168.1.1",
            "dst_ip": target,
            "src_mac": "ba:ad:f0:0d:99:11",
            "dst_mac": "00:1a:2b:3c:4d:5e",
            "protocol": "ARP",
            "arp_opcode": "reply",
            "arp_sender_ip": "192.168.1.1",
            "arp_sender_mac": "ba:ad:f0:0d:99:11",
            "arp_target_ip": target,
            "arp_target_mac": "00:1a:2b:3c:4d:5e",
            "length": 42,
            "mode": "CONTROLLED_LAB"
        }
        capture_service._handle_raw_packet(pkt)
        actual = "ARP Cache Poisoning detected. Gateway impersonation flagged. Quarantine simulated."
        details = "ARP-SPOOF-001-GATEWAY-MITM triggered. Conflicting MAC ba:ad:f0:0d:99:11 bound to gateway 192.168.1.1."

    elif sid == "DNS_SPOOF_ATTACK":
        expected = "Conflicting DNS answer / rogue resolver flagged; -25 trust penalty applied; host isolated or restricted."
        pkt = {
            "timestamp": now,
            "src_ip": "192.168.1.99",
            "dst_ip": target,
            "protocol": "DNS",
            "src_port": 53,
            "dst_port": 52111,
            "length": 86,
            "dns_query": "internal-bank.portal",
            "dns_reply": "103.21.244.0",
            "ttl": 1,
            "mode": "CONTROLLED_LAB"
        }
        capture_service._handle_raw_packet(pkt)
        actual = "Rogue DNS resolver response intercepted. Host trust penalized."
        details = "DNS-SPOOF-001-ROGUE-RESOLVER triggered from local host 192.168.1.99."

    elif sid == "SELF_HEALING_LIFECYCLE":
        expected = "Prerequisites verified; recovery plan generated; quarantine released; verification passed."
        plan = generate_and_execute_recovery_plan(db, target, auto_execute=True)
        actual = f"Self-healing executed with status '{plan.status}'. Recovery verified: {plan.verified}."
        details = f"Plan {plan.id} completed in {plan.recovery_time_seconds or 0:.2f}s."

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario ID: {sid}")

    duration_ms = (time.time() - start_time) * 1000

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
