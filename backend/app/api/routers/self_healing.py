from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.self_healing import SelfHealingPlan
from app.schemas import SelfHealingPlanSchema
from app.self_healing.self_healing_engine import evaluate_recovery_prerequisites, generate_and_execute_recovery_plan
from app.core.config import settings

router = APIRouter(prefix="/api/self-healing", tags=["Self-Healing Engine"])

class EvaluateRequest(BaseModel):
    entity_id: str

class ExecuteRecoveryRequest(BaseModel):
    entity_id: str
    auto_execute: bool = True

@router.get("/plans", response_model=List[SelfHealingPlanSchema])
def list_recovery_plans(db: Session = Depends(get_db)):
    return db.query(SelfHealingPlan).order_by(SelfHealingPlan.created_at.desc()).all()

@router.post("/evaluate")
def evaluate_entity(req: EvaluateRequest, db: Session = Depends(get_db)):
    satisfied, breakdown = evaluate_recovery_prerequisites(db, req.entity_id)
    return {
        "entity_id": req.entity_id,
        "prerequisites_satisfied": satisfied,
        "breakdown": breakdown
    }

@router.post("/execute", response_model=SelfHealingPlanSchema)
def execute_plan(req: ExecuteRecoveryRequest, db: Session = Depends(get_db)):
    plan = generate_and_execute_recovery_plan(
        db,
        req.entity_id,
        auto_execute=req.auto_execute and settings.AUTO_HEALING_ENABLED
    )
    return plan
