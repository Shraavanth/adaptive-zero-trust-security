import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.policy import RepeatOffender

ESCALATION_LEVELS = {
    1: "ACTIVE",
    2: "ENHANCED_MONITORING",
    3: "EXTENDED_QUARANTINE",
    4: "PERMANENT_BLOCK"
}

def record_qualifying_incident(
    db: Session,
    entity_id: str,
    event: Dict[str, Any]
) -> RepeatOffender:
    """
    Records a confirmed qualifying security incident and escalates offender state.
    """
    ip_addr = event.get("src_ip", "N/A")
    mac_addr = event.get("src_mac", "N/A")
    category = str(event.get("category", "UNKNOWN"))

    offender = db.query(RepeatOffender).filter(RepeatOffender.entity_id == entity_id).first()
    now = datetime.datetime.utcnow()

    if not offender:
        offender = RepeatOffender(
            entity_id=entity_id,
            ip_address=ip_addr,
            mac_address=mac_addr,
            qualifying_incident_count=1,
            escalation_state="ACTIVE",
            first_incident_time=now,
            last_incident_time=now,
            attack_categories=category,
            notes=f"Initial qualifying incident: {category}"
        )
        db.add(offender)
    else:
        offender.qualifying_incident_count += 1
        offender.last_incident_time = now

        count = offender.qualifying_incident_count
        new_state = ESCALATION_LEVELS.get(count, "PERMANENT_BLOCK")
        offender.escalation_state = new_state

        cats = set(offender.attack_categories.split(",")) if offender.attack_categories else set()
        cats.add(category)
        offender.attack_categories = ",".join(sorted(cats))
        offender.notes = f"Escalated to {new_state} upon incident #{count} ({category})"

    db.commit()
    db.refresh(offender)
    return offender
