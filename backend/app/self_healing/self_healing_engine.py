import uuid
import json
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.self_healing import SelfHealingPlan, SelfHealingLog
from app.models.trust import DeviceTrust
from app.models.detection import SecurityEvent
from app.models.policy import RepeatOffender
from app.models.response import IsolationRecord, ResponseAction
from app.models.audit import AuditLog
from app.core.config import settings

def evaluate_recovery_prerequisites(
    db: Session,
    entity_id: str
) -> Tuple[bool, Dict[str, Any]]:
    """
    Evaluates the strict 4-point prerequisites for self-healing recovery:
      1. Clean window: No malicious event in last 5 minutes (300s).
      2. Trust score: >= 80.
      3. Behavior risk: < 70.
      4. Repeat offender: Not in PERMANENT_BLOCK state.
    """
    now = datetime.datetime.utcnow()
    cutoff_time = now - datetime.timedelta(seconds=settings.RECOVERY_CLEAN_WINDOW_SECONDS)

    # 1. Check clean window
    recent_malicious = db.query(SecurityEvent).filter(
        SecurityEvent.src_ip == entity_id,
        SecurityEvent.timestamp >= cutoff_time
    ).first()
    clean_window_ok = (recent_malicious is None)
    clean_window_details = (
        "No security incidents detected in previous 5 minutes."
        if clean_window_ok else
        f"Blocked: Malicious event '{recent_malicious.category}' occurred at {recent_malicious.timestamp}."
    )

    # 2. Check Device Trust Score
    device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == entity_id).first()
    trust_score = device.current_trust_score if device else 100
    trust_ok = (trust_score >= settings.RECOVERY_MIN_TRUST_SCORE)
    trust_details = (
        f"Trust score {trust_score}/100 meets recovery threshold ({settings.RECOVERY_MIN_TRUST_SCORE})."
        if trust_ok else
        f"Blocked: Trust score {trust_score}/100 is below required {settings.RECOVERY_MIN_TRUST_SCORE}."
    )

    # 3. Check Behavior Risk Score
    behavior_risk = device.behavior_risk_score if device else 0
    risk_ok = (behavior_risk <= settings.RECOVERY_MAX_RISK_SCORE)
    risk_details = (
        f"Behavior risk {behavior_risk}/100 is within acceptable bounds (< {settings.RISK_ISOLATE_THRESHOLD})."
        if risk_ok else
        f"Blocked: Behavior risk {behavior_risk}/100 exceeds limit of {settings.RECOVERY_MAX_RISK_SCORE}."
    )

    # 4. Check Repeat Offender Escalation State
    offender = db.query(RepeatOffender).filter(RepeatOffender.entity_id == entity_id).first()
    repeat_state = offender.escalation_state if offender else "NONE"
    repeat_ok = (repeat_state != "PERMANENT_BLOCK")
    repeat_details = (
        f"Repeat offender status '{repeat_state}' allows autonomous recovery."
        if repeat_ok else
        "Blocked: Entity is classified as PERMANENT_BLOCK. Manual administrative override required."
    )

    all_satisfied = clean_window_ok and trust_ok and risk_ok and repeat_ok

    breakdown = {
        "clean_window_satisfied": clean_window_ok,
        "clean_window_details": clean_window_details,
        "trust_score_satisfied": trust_ok,
        "trust_score_details": trust_details,
        "behavior_risk_satisfied": risk_ok,
        "behavior_risk_details": risk_details,
        "repeat_policy_satisfied": repeat_ok,
        "repeat_policy_details": repeat_details,
        "evaluated_at": now.isoformat()
    }

    return all_satisfied, breakdown

def generate_and_execute_recovery_plan(
    db: Session,
    entity_id: str,
    auto_execute: bool = True
) -> SelfHealingPlan:
    """
    Simulates the local recovery-state lifecycle for an isolated or restricted entity.
    """
    plan_id = f"REC-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.datetime.utcnow()

    # 1. Evaluate prerequisites
    satisfied, breakdown = evaluate_recovery_prerequisites(db, entity_id)

    plan = SelfHealingPlan(
        id=plan_id,
        entity_id=entity_id,
        status="ELIGIBLE" if satisfied else "BLOCKED",
        reason="Autonomous self-healing lifecycle verification",
        prerequisites_satisfied=satisfied,
        prerequisites_breakdown=json.dumps(breakdown),
        created_at=now,
        verified=False,
        rollback_performed=False
    )
    db.add(plan)
    db.flush()

    # Log initial evaluation step
    log_eval = SelfHealingLog(
        plan_id=plan_id,
        timestamp=now,
        step_name="PREREQUISITE_VERIFICATION",
        status="SUCCESS" if satisfied else "WARNING",
        details="All 4 security prerequisites satisfied." if satisfied else "Prerequisite validation failed."
    )
    db.add(log_eval)

    if not satisfied or not auto_execute:
        db.commit()
        db.refresh(plan)
        return plan

    # 2. Execute recovery actions
    plan.status = "EXECUTING"
    plan.executed_at = datetime.datetime.utcnow()

    # Log execution start
    log_exec = SelfHealingLog(
        plan_id=plan_id,
        timestamp=datetime.datetime.utcnow(),
        step_name="RECOVERY_EXECUTION",
        status="INFO",
        details=f"Simulating the local quarantine-release state update for {entity_id}."
    )
    db.add(log_exec)

    # Revoke isolation record
    iso_records = db.query(IsolationRecord).filter(
        IsolationRecord.entity_id == entity_id,
        IsolationRecord.status.in_(("ISOLATED", "SIMULATED"))
    ).all()
    for iso in iso_records:
        iso.status = "RELEASED"
        iso.released_at = datetime.datetime.utcnow()
        iso.release_reason = f"Autonomous self-healing recovery completed (Plan {plan_id})"

    # Update DeviceTrust state
    device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == entity_id).first()
    if device:
        device.state = "TRUSTED" if device.current_trust_score >= 80 else "MONITOR"

    # Add Response Action
    action = ResponseAction(
        id=f"ACT-{uuid.uuid4().hex[:12].upper()}",
        target_entity=entity_id,
        action_type="RELEASE",
        requested_operation="Autonomous self-healing quarantine release",
        execution_mode="SIMULATED",
        execution_status="SIMULATED",
        start_time=now,
        end_time=datetime.datetime.utcnow(),
        result_details=f"Simulated release recorded for {entity_id}; no network policy was changed.",
        is_verified=False,
        rollback_status="NONE"
    )
    db.add(action)

    # 3. Post-execution health verification
    plan.verified = False
    plan.verification_details = (
        "Local recovery state was simulated. Network ACLs and host connectivity were not modified or verified."
    )
    plan.completed_at = datetime.datetime.utcnow()
    plan.status = "SIMULATED"
    plan.recovery_time_seconds = (plan.completed_at - plan.created_at).total_seconds()

    log_verify = SelfHealingLog(
        plan_id=plan_id,
        timestamp=datetime.datetime.utcnow(),
        step_name="SIMULATED_STATE_UPDATE",
        status="INFO",
        details="Local isolation records and trust state were updated; no external network health check was performed."
    )
    db.add(log_verify)

    # Audit Trail
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=datetime.datetime.utcnow(),
        action="SELF_HEALING_SIMULATED",
        actor="SELF_HEALING_AUTOMATION",
        category="HEALING",
        target=entity_id,
        details=f"Self-healing state transition was simulated for entity {entity_id}; network health was not verified.",
        status="SIMULATED"
    )
    db.add(audit)

    db.commit()
    db.refresh(plan)
    return plan
