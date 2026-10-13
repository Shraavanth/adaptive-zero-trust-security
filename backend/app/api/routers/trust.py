from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.trust import DeviceTrust, TrustHistory
from app.schemas import DeviceTrustSchema, TrustHistorySchema

router = APIRouter(prefix="/api/trust", tags=["Device Trust"])

@router.get("", response_model=List[DeviceTrustSchema])
def list_device_trust(db: Session = Depends(get_db)):
    return db.query(DeviceTrust).order_by(DeviceTrust.current_trust_score.asc()).all()

@router.get("/{entity_id}/history", response_model=List[TrustHistorySchema])
def get_entity_trust_history(entity_id: str, db: Session = Depends(get_db)):
    history = db.query(TrustHistory).filter(
        TrustHistory.entity_id == entity_id
    ).order_by(TrustHistory.timestamp.desc()).all()
    return history
