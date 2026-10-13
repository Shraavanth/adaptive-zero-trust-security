from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.audit import AuditLog
from app.schemas import AuditLogSchema

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogSchema])
def list_audit_trail(db: Session = Depends(get_db), limit: int = Query(100, le=500)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
