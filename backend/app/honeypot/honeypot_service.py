import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.honeypot import HoneypotInstance, HoneypotEvent
from app.models.audit import AuditLog

DEFAULT_HONEYPOTS = [
    {
        "name": "HTTP Phishing Decoy Portal",
        "service_type": "HTTP_PHISHING_TRAP",
        "port": 8080,
        "ip_address": "127.0.0.1",
        "mode": "SIMULATED"
    },
    {
        "name": "Internal SSH Bastion Decoy",
        "service_type": "SSH_DECOY",
        "port": 2222,
        "ip_address": "127.0.0.1",
        "mode": "SIMULATED"
    },
    {
        "name": "DNS Poison Sinkhole",
        "service_type": "DNS_SINKHOLE",
        "port": 5353,
        "ip_address": "127.0.0.1",
        "mode": "SIMULATED"
    },
    {
        "name": "Legacy Telnet Switch Decoy",
        "service_type": "TELNET_TRAP",
        "port": 2323,
        "ip_address": "127.0.0.1",
        "mode": "SIMULATED"
    }
]

def seed_default_honeypots(db: Session):
    """Ensures standard honeypot instances are initialized in the database."""
    count = db.query(HoneypotInstance).count()
    if count == 0:
        for hp_info in DEFAULT_HONEYPOTS:
            inst = HoneypotInstance(
                id=f"HP-{uuid.uuid4().hex[:8].upper()}",
                name=hp_info["name"],
                service_type=hp_info["service_type"],
                port=hp_info["port"],
                ip_address=hp_info["ip_address"],
                status="RUNNING",
                interaction_count=0,
                mode=hp_info["mode"],
                deployed_at=datetime.datetime.utcnow(),
                health_status="HEALTHY"
            )
            db.add(inst)
        db.commit()

def record_honeypot_interaction(
    db: Session,
    honeypot_id: str,
    src_ip: str,
    src_port: Optional[int],
    interaction_type: str,
    payload_snippet: Optional[str] = None,
    threat_level: str = "HIGH",
    linked_event_id: Optional[str] = None,
    mode: str = "SIMULATED"
) -> HoneypotEvent:
    """
    Records an attacker engagement with an active honeypot decoy.
    """
    now = datetime.datetime.utcnow()
    event_id = f"HPE-{uuid.uuid4().hex[:12].upper()}"

    event = HoneypotEvent(
        id=event_id,
        honeypot_id=honeypot_id,
        timestamp=now,
        src_ip=src_ip,
        src_port=src_port,
        interaction_type=interaction_type,
        payload_snippet=payload_snippet,
        threat_level=threat_level,
        linked_event_id=linked_event_id,
        mode=mode
    )
    db.add(event)

    # Increment interaction count on honeypot instance
    inst = db.query(HoneypotInstance).filter(HoneypotInstance.id == honeypot_id).first()
    if inst:
        inst.interaction_count += 1
        inst.last_interaction = now
        inst.status = "ALERTING"

    # Add to audit trail
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now,
        action="HONEYPOT_TRIGGERED",
        actor="DECOY_SUBSYSTEM",
        category="HONEYPOT",
        target=src_ip,
        details=f"Adversary interaction '{interaction_type}' recorded on decoy {honeypot_id}.",
        status="SUCCESS"
    )
    db.add(audit)

    db.commit()
    db.refresh(event)
    return event
