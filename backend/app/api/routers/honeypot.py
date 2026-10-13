from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.honeypot import HoneypotInstance, HoneypotEvent
from app.schemas import HoneypotInstanceSchema, HoneypotEventSchema
from app.honeypot.honeypot_service import seed_default_honeypots

router = APIRouter(prefix="/api/honeypots", tags=["Honeypot Monitoring"])

@router.get("", response_model=List[HoneypotInstanceSchema])
def list_honeypots(db: Session = Depends(get_db)):
    seed_default_honeypots(db)
    return db.query(HoneypotInstance).all()

@router.get("/events", response_model=List[HoneypotEventSchema])
def list_honeypot_events(db: Session = Depends(get_db)):
    return db.query(HoneypotEvent).order_by(HoneypotEvent.timestamp.desc()).all()
