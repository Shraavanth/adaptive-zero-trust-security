from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.policy import ZeroTrustDecision, RepeatOffender
from app.schemas import ZeroTrustDecisionSchema, RepeatOffenderSchema

router = APIRouter(prefix="/api/policies", tags=["Zero Trust Policies"])

@router.get("/decisions", response_model=List[ZeroTrustDecisionSchema])
def list_decisions(db: Session = Depends(get_db), limit: int = Query(50, le=500)):
    return db.query(ZeroTrustDecision).order_by(ZeroTrustDecision.timestamp.desc()).limit(limit).all()

@router.get("/repeat-offenders", response_model=List[RepeatOffenderSchema])
def list_repeat_offenders(db: Session = Depends(get_db)):
    return db.query(RepeatOffender).order_by(RepeatOffender.qualifying_incident_count.desc()).all()
