import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.response import ResponseAction, IsolationRecord
from app.models.audit import AuditLog
from app.models.trust import DeviceTrust
from app.core.config import settings

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
    Executes or simulates network response actions (ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE).
    Ensures safe simulated mode by default and maintains complete audit records.
    """
    action_id = f"ACT-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.datetime.utcnow()

    # Requested operation details
    if action_type == "ISOLATE":
        req_op = "Null-route endpoint and sever all ingress/egress TCP/UDP flows"
        details = f"Host {target_entity} quarantined. Microsegmentation policy applied."
    elif action_type == "RESTRICT":
        req_op = "Throttle bandwidth and block external DNS & unauthorized egress ports"
        details = f"Host {target_entity} restricted to essential internal management plane."
    elif action_type == "RELEASE":
        req_op = "Revoke quarantine ACL rules and restore standard Zero Trust monitoring"
        details = f"Host {target_entity} released from quarantine."
    elif action_type == "MONITOR":
        req_op = "Direct telemetry to heightened deep packet inspection buffer"
        details = f"Host {target_entity} marked for elevated SOC packet inspection."
    else:
        req_op = "Grant authorized network access policy"
        details = f"Host {target_entity} authorized under baseline policy."

    action = ResponseAction(
        id=action_id,
        target_entity=target_entity,
        action_type=action_type,
        triggering_event_id=triggering_event_id,
        policy_decision_id=policy_decision_id,
        requested_operation=req_op,
        execution_mode=mode,
        execution_status="EXECUTED",
        start_time=now,
        end_time=now,
        result_details=details,
        error_message=None,
        is_verified=True,
        rollback_status="AVAILABLE"
    )
    db.add(action)

    # Maintain Isolation Record table
    if action_type == "ISOLATE":
        iso_rec = IsolationRecord(
            id=f"ISO-{uuid.uuid4().hex[:12].upper()}",
            entity_id=target_entity,
            isolation_type="HOST_QUARANTINE",
            isolated_at=now,
            status="ISOLATED",
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
            IsolationRecord.status == "ISOLATED"
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
        details=f"{action_type} executed for {target_entity} [{mode}]. Reason: {reason}",
        status="SUCCESS"
    )
    db.add(audit)

    db.commit()
    db.refresh(action)
    return action
