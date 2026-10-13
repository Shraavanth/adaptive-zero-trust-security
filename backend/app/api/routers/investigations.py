import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.detection import Investigation
from app.schemas import InvestigationSchema, CreateInvestigationRequest

router = APIRouter(prefix="/api/investigations", tags=["Investigation Center"])

@router.get("", response_model=List[InvestigationSchema])
def list_investigations(db: Session = Depends(get_db)):
    return db.query(Investigation).order_by(Investigation.updated_at.desc()).all()

@router.post("", response_model=InvestigationSchema)
def create_investigation(req: CreateInvestigationRequest, db: Session = Depends(get_db)):
    inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.datetime.utcnow()
    inv = Investigation(
        id=inv_id,
        title=req.title,
        event_id=req.event_id,
        status="OPEN",
        priority=req.priority,
        analyst=req.analyst,
        notes=req.notes or "",
        evidence_links=f"Event ref: {req.event_id}",
        created_at=now,
        updated_at=now
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv

@router.patch("/{inv_id}")
def update_investigation(inv_id: str, status: Optional[str] = None, notes: Optional[str] = None, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation case not found.")
    if status:
        inv.status = status.upper()
    if notes:
        inv.notes = notes
    inv.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "UPDATED", "investigation_id": inv_id}
