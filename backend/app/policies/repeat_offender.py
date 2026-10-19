import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.policy import RepeatOffender, RepeatOffenderIncident

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
    event_id = event.get("id")

    offender = db.query(RepeatOffender).filter(RepeatOffender.entity_id == entity_id).first()
    if event_id:
        recorded_incident = db.query(RepeatOffenderIncident).filter(
            RepeatOffenderIncident.event_id == event_id
        ).first()
        if recorded_incident:
            if recorded_incident.entity_id != entity_id:
                raise ValueError(f"Event {event_id} is already assigned to another entity.")
            if offender is None:
                raise RuntimeError(f"Repeat-offender record is missing for event {event_id}.")
            return offender

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

    if event_id:
        db.add(RepeatOffenderIncident(
            event_id=event_id,
            entity_id=entity_id,
            recorded_at=now,
        ))

    db.commit()
    db.refresh(offender)
    return offender
