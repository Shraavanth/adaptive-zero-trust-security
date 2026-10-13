from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.detection import SecurityEvent
from app.models.trust import DeviceTrust
from app.core.config import settings

SEVERITY_WEIGHTS = {
    "CRITICAL": 40,
    "HIGH": 25,
    "MEDIUM": 15,
    "LOW": 8,
    "INFO": 3
}

def calculate_behavior_risk(
    db: Session,
    entity_id: str,
    recent_event: Dict[str, Any]
) -> int:
    """
    Computes explainable behavior-risk score (0 to 100) based on cumulative severity,
    attack frequency, detection confidence, and persistent repeat behavior.
    """
    # 1. Base severity from incoming event
    sev = str(recent_event.get("severity", "MEDIUM")).upper()
    base_weight = SEVERITY_WEIGHTS.get(sev, 15)

    # 2. Confidence scaling
    confidence = float(recent_event.get("confidence", 0.85))
    calibrated_base = base_weight * confidence

    # 3. Query historical events for this entity
    prior_events = db.query(SecurityEvent).filter(
        SecurityEvent.src_ip == entity_id
    ).all()
    prior_count = len(prior_events)

    # Cumulative severity increment: 8 points per prior incident
    history_increment = min(40, prior_count * 8)

    # 4. Critical attack category boosts (e.g. gateway MITM or active credential theft)
    category = str(recent_event.get("category", "")).upper()
    category_multiplier = 1.0
    if category in ("ARP_SPOOFING", "PHISHING"):
        category_multiplier = 1.25

    raw_risk = (calibrated_base + history_increment) * category_multiplier
    final_score = int(min(100, max(0, round(raw_risk))))

    # Update device trust model with calculated risk score
    device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == entity_id).first()
    if device:
        device.behavior_risk_score = final_score
        db.commit()

    return final_score
