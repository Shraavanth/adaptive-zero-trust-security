import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.trust import DeviceTrust, TrustHistory
from app.core.config import settings

def determine_trust_state(score: int) -> str:
    if score >= settings.TRUSTED_THRESHOLD:
        return "TRUSTED"
    elif score >= settings.MONITOR_THRESHOLD:
        return "MONITOR"
    elif score >= settings.RESTRICT_THRESHOLD:
        return "RESTRICT"
    else:
        return "ISOLATE"

def apply_event_penalty(
    db: Session,
    event: Dict[str, Any]
) -> Tuple[DeviceTrust, Optional[TrustHistory]]:
    """
    Applies trust penalty to the offending entity (IP or MAC address).
    Guarantees idempotency (avoids double penalty for the same event_id).
    Updates state bands and logs score history.
    """
    entity_id = event.get("src_ip")
    if not entity_id or entity_id == "N/A":
        entity_id = event.get("src_mac", "UNKNOWN")

    event_id = event.get("id")

    # 1. Check idempotency: has this event already penalized the entity?
    if event_id:
        existing_hist = db.query(TrustHistory).filter(
            TrustHistory.event_id == event_id,
            TrustHistory.entity_id == entity_id
        ).first()
        if existing_hist:
            device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == entity_id).first()
            return device, None

    # 2. Get or create device trust entry
    device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == entity_id).first()
    if not device:
        device = DeviceTrust(
            entity_id=entity_id,
            ip_address=event.get("src_ip", "N/A"),
            mac_address=event.get("src_mac", "N/A"),
            current_trust_score=settings.INITIAL_TRUST_SCORE,
            behavior_risk_score=0,
            state="TRUSTED",
            total_incidents=0,
            last_penalty_reason=None,
            last_evaluated=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow(),
            is_active=True
        )
        db.add(device)
        db.flush()

    # 3. Determine penalty amount
    category = str(event.get("category", "")).upper()
    penalty = {
        "INFORMATIONAL": settings.PENALTY_INFORMATIONAL,
        "INFO": settings.PENALTY_INFORMATIONAL,
        "PHISHING": settings.PENALTY_PHISHING,
        "DNS_SPOOFING": settings.PENALTY_DNS_SPOOFING,
        "ARP_SPOOFING": settings.PENALTY_ARP_SPOOFING,
        "PORT_SCAN": 20,
        "ANOMALY": 10,
    }.get(category, 10)

    # 4. Calculate new score (bounded between 0 and 100)
    prev_score = device.current_trust_score
    new_score = max(0, prev_score - penalty)

    reason = f"{event.get('detection_reason', f'{category} incident detected')} (-{penalty} pts)"
    device.current_trust_score = new_score
    device.state = determine_trust_state(new_score)
    device.total_incidents += 1
    device.last_penalty_reason = reason
    device.last_evaluated = datetime.datetime.utcnow()

    # 5. Persist trust history entry
    hist = TrustHistory(
        entity_id=entity_id,
        timestamp=datetime.datetime.utcnow(),
        previous_score=prev_score,
        new_score=new_score,
        penalty_applied=penalty,
        reason=reason,
        event_id=event_id
    )
    db.add(hist)
    db.commit()
    db.refresh(device)

    return device, hist
