from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.detection import SecurityEvent
from app.schemas import SecurityEventSchema

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

@router.patch("/{event_id}/status")
def update_threat_status(event_id: str, status: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Threat event not found.")
    event.investigation_status = status.upper()
    db.commit()
    return {"status": "UPDATED", "event_id": event_id, "new_status": status.upper()}
