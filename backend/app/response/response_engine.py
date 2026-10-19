import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.response import ResponseAction, IsolationRecord
from app.models.audit import AuditLog
from app.models.trust import DeviceTrust

ACTION_OPERATIONS = {
    "ISOLATE": "Would null-route endpoint and sever ingress/egress flows",
    "RESTRICT": "Would throttle bandwidth and block unauthorized egress",
    "RELEASE": "Would revoke quarantine ACL rules and restore monitoring",
    "MONITOR": "Would direct telemetry to heightened inspection",
    "ALLOW": "Would grant baseline network access",
}

ROLLBACK_ACTIONS = {
    "ISOLATE": "RELEASE",
    "RESTRICT": "ALLOW",
    "RELEASE": "ISOLATE",
    "MONITOR": "ALLOW",
    "ALLOW": "RESTRICT",
}

def preview_response_action(
    db: Session,
    target_entity: str,
    action_type: str,
    reason: str,
) -> Dict[str, Any]:
    """Build a simulated response preview without changing persistent state."""
    action_type = action_type.upper()
    if action_type not in ACTION_OPERATIONS:
        raise ValueError(f"Unsupported response action: {action_type}")

    affected_records = ["response_actions", "audit_logs"]
    if action_type in ("ISOLATE", "RELEASE"):
        device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == target_entity).first()
        if device:
            affected_records.append("device_trust")

    active_isolation = None
    if action_type == "RELEASE":
        active_isolation = db.query(IsolationRecord).filter(
            IsolationRecord.entity_id == target_entity,
            IsolationRecord.status.in_(("ISOLATED", "SIMULATED")),
        ).first()
    if action_type == "ISOLATE" or active_isolation:
        affected_records.append("isolation_records")

    return {
        "target_entity": target_entity,
        "action_type": action_type,
        "execution_mode": "SIMULATED",
        "requested_operation": ACTION_OPERATIONS[action_type],
        "reason": reason,
        "would_mutate_state": False,
        "affected_local_records": affected_records,
        "rollback_action": ROLLBACK_ACTIONS[action_type],
        "rollback_limitations": (
            "Preview only; no records or network controls were changed. "
            "The inverse is a suggested simulated action, not a transactional rollback "
            "or restoration of external network state."
        ),
    }

def execute_response_action(
    db: Session,
    target_entity: str,
    action_type: str,
    reason: str,
    triggering_event_id: Optional[str] = None,
    policy_decision_id: Optional[str] = None,
    mode: str = "SIMULATED"
) -> ResponseAction:
    """
    Records a simulated response action (ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE).
    Network enforcement is not implemented by this engine.
    """
    action_type = action_type.upper()
    if action_type not in ("ALLOW", "MONITOR", "RESTRICT", "ISOLATE", "RELEASE"):
        raise ValueError(f"Unsupported response action: {action_type}")
    if mode != "SIMULATED":
        raise ValueError("Real network enforcement is not implemented; only SIMULATED mode is available.")

    action_id = f"ACT-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.datetime.utcnow()

    # Requested operation details
    if action_type == "ISOLATE":
        req_op = ACTION_OPERATIONS[action_type]
        details = f"Simulated isolation recorded for {target_entity}; no network policy was changed."
    elif action_type == "RESTRICT":
        req_op = ACTION_OPERATIONS[action_type]
        details = f"Simulated restriction recorded for {target_entity}; no traffic controls were changed."
    elif action_type == "RELEASE":
        req_op = ACTION_OPERATIONS[action_type]
        details = f"Simulated release recorded for {target_entity}; no network policy was changed."
    elif action_type == "MONITOR":
        req_op = ACTION_OPERATIONS[action_type]
        details = f"Simulated monitoring action recorded for {target_entity}; no capture settings were changed."
    else:
        req_op = ACTION_OPERATIONS[action_type]
        details = f"Simulated allow action recorded for {target_entity}; no network policy was changed."

    action = ResponseAction(
        id=action_id,
        target_entity=target_entity,
        action_type=action_type,
        triggering_event_id=triggering_event_id,
        policy_decision_id=policy_decision_id,
        requested_operation=req_op,
        execution_mode=mode,
        execution_status="SIMULATED",
        start_time=now,
        end_time=now,
        result_details=details,
        error_message=None,
        is_verified=False,
        rollback_status="NONE"
    )
    db.add(action)

    # Maintain Isolation Record table
    if action_type == "ISOLATE":
        iso_rec = IsolationRecord(
            id=f"ISO-{uuid.uuid4().hex[:12].upper()}",
            entity_id=target_entity,
            isolation_type="HOST_QUARANTINE",
            isolated_at=now,
            status="SIMULATED",
            execution_mode=mode
        )
        db.add(iso_rec)

        # Update DeviceTrust state
        device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == target_entity).first()
        if device:
            device.state = "ISOLATE"

    elif action_type == "RELEASE":
        # Find active isolation record and mark released
        active_iso = db.query(IsolationRecord).filter(
            IsolationRecord.entity_id == target_entity,
            IsolationRecord.status.in_(("ISOLATED", "SIMULATED"))
        ).first()
        if active_iso:
            active_iso.status = "RELEASED"
            active_iso.released_at = now
            active_iso.release_reason = reason

        # Restore DeviceTrust state based on trust score
        device = db.query(DeviceTrust).filter(DeviceTrust.entity_id == target_entity).first()
        if device:
            device.state = "TRUSTED" if device.current_trust_score >= 80 else "MONITOR"

    # Add audit log entry
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
        timestamp=now,
        action=f"RESPONSE_{action_type}",
        actor="AUTOMATED_POLICY_ENGINE",
        category="INCIDENT_RESPONSE",
        target=target_entity,
        details=f"{action_type} simulated for {target_entity} [{mode}]. No network controls were changed. Reason: {reason}",
        status="SIMULATED"
    )
    db.add(audit)

    db.commit()
    db.refresh(action)
    return action
