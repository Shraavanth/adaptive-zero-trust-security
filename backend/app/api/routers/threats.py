from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.detection import SecurityEvent
from app.models.capture import PacketRecord
from app.models.policy import ZeroTrustDecision
from app.models.response import ResponseAction
from app.models.trust import TrustHistory
from app.schemas import (
    IncidentEvidenceSchema,
    IncidentTimelineEntrySchema,
    SecurityEventSchema,
)

router = APIRouter(prefix="/api/threats", tags=["Threat Detection"])

@router.get("", response_model=List[SecurityEventSchema])
def list_threats(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None
):
    query = db.query(SecurityEvent)
    if category:
        query = query.filter(SecurityEvent.category == category.upper())
    if severity:
        query = query.filter(SecurityEvent.severity == severity.upper())
    if status:
        query = query.filter(SecurityEvent.investigation_status == status.upper())

    events = query.order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=SecurityEventSchema)
def get_threat_detail(event_id: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Threat event not found.")
    return event

@router.get("/{event_id}/evidence", response_model=IncidentEvidenceSchema)
def get_threat_evidence(event_id: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Threat event not found.")

    packet_query = db.query(PacketRecord).filter(
        PacketRecord.related_event_id == event.id
    )
    if event.related_packet_id is not None:
        packet_query = db.query(PacketRecord).filter(PacketRecord.id == event.related_packet_id)
    packet = packet_query.order_by(PacketRecord.timestamp.asc(), PacketRecord.id.asc()).first()
    trust_history = db.query(TrustHistory).filter(
        TrustHistory.event_id == event.id
    ).order_by(TrustHistory.timestamp.asc(), TrustHistory.id.asc()).all()
    decisions = db.query(ZeroTrustDecision).filter(
        ZeroTrustDecision.triggering_event_id == event.id
    ).order_by(ZeroTrustDecision.timestamp.asc(), ZeroTrustDecision.id.asc()).all()
    response_actions = db.query(ResponseAction).filter(
        ResponseAction.triggering_event_id == event.id
    ).order_by(ResponseAction.start_time.asc(), ResponseAction.id.asc()).all()

    timeline = [
        IncidentTimelineEntrySchema(
            timestamp=event.timestamp,
            record_type="DETECTION",
            title=f"{event.severity} {event.category} detected",
            detail=f"{event.rule_id}: {event.detection_reason}",
            status=event.investigation_status,
        )
    ]
    if packet:
        timeline.append(IncidentTimelineEntrySchema(
            timestamp=packet.timestamp,
            record_type="PACKET",
            title=f"{packet.protocol} packet persisted",
            detail=(
                f"{packet.src_ip}:{packet.src_port or '-'} → "
                f"{packet.dst_ip}:{packet.dst_port or '-'}; "
                f"{packet.length} bytes; mode {packet.mode}."
            ),
            status=packet.detection_status,
        ))
    timeline.extend(
        IncidentTimelineEntrySchema(
            timestamp=item.timestamp,
            record_type="TRUST",
            title=f"Trust changed {item.previous_score} → {item.new_score}",
            detail=f"{item.reason} (penalty: {item.penalty_applied}).",
        )
        for item in trust_history
    )
    timeline.extend(
        IncidentTimelineEntrySchema(
            timestamp=item.timestamp,
            record_type="POLICY",
            title=f"Zero Trust decision: {item.decision}",
            detail=item.reason,
            status=item.execution_status,
        )
        for item in decisions
    )
    timeline.extend(
        IncidentTimelineEntrySchema(
            timestamp=item.start_time,
            record_type="RESPONSE",
            title=f"{item.action_type} response recorded",
            detail=item.result_details,
            status=item.execution_status,
        )
        for item in response_actions
    )
    timeline.sort(key=lambda item: item.timestamp)

    return IncidentEvidenceSchema(
        event=event,
        packet=packet,
        trust_history=trust_history,
        policy_decisions=decisions,
        response_actions=response_actions,
        timeline=timeline,
    )

@router.patch("/{event_id}/status")
def update_threat_status(event_id: str, status: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Threat event not found.")
    event.investigation_status = status.upper()
    db.commit()
    return {"status": "UPDATED", "event_id": event_id, "new_status": status.upper()}
