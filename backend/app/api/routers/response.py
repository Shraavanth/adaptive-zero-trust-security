from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.response import ResponseAction, IsolationRecord
from app.schemas import (
    ExecuteActionRequest,
    PreviewActionRequest,
    ResponseActionSchema,
    ResponsePreviewSchema,
)
from app.response.response_engine import execute_response_action, preview_response_action

router = APIRouter(prefix="/api/response", tags=["Response & Isolation"])

@router.get("/actions", response_model=List[ResponseActionSchema])
def list_actions(db: Session = Depends(get_db)):
    return db.query(ResponseAction).order_by(ResponseAction.start_time.desc()).all()

@router.get("/isolations")
def list_isolations(db: Session = Depends(get_db)):
    return db.query(IsolationRecord).order_by(IsolationRecord.isolated_at.desc()).all()

@router.post("/preview", response_model=ResponsePreviewSchema)
def preview_response(req: PreviewActionRequest, db: Session = Depends(get_db)):
    try:
        return preview_response_action(
            db=db,
            target_entity=req.target_entity,
            action_type=req.action_type,
            reason=req.reason,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/execute", response_model=ResponseActionSchema)
def trigger_response(req: ExecuteActionRequest, db: Session = Depends(get_db)):
    try:
        action = execute_response_action(
            db=db,
            target_entity=req.target_entity,
            action_type=req.action_type.upper(),
            reason=req.reason,
            mode=req.mode or "SIMULATED"
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return action
