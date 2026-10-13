import uuid
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.policy import ZeroTrustDecision
from app.models.trust import DeviceTrust
from app.core.config import settings

def evaluate_zero_trust_policy(
    db: Session,
    entity_id: str,
    event: Dict[str, Any],
    trust_score: int,
    behavior_risk: int,
    mode: str = "LIVE_CAPTURE"
) -> ZeroTrustDecision:
    """
    Evaluates Zero Trust access policy matrix.
    Rules:
      - Risk >= 70 -> ISOLATE (Emergency Override)
      - Trust 80 - 100 -> ALLOW
      - Trust 60 - 79  -> MONITOR
      - Trust 30 - 59  -> RESTRICT
      - Trust 0 - 29   -> ISOLATE
    """
    decision_id = f"ZTD-{uuid.uuid4().hex[:12].upper()}"

    if behavior_risk >= settings.RISK_ISOLATE_THRESHOLD:
        decision = "ISOLATE"
        reason = (
            f"Risk Score Override: Behavior-risk score reached {behavior_risk}/100 "
            f"(threshold {settings.RISK_ISOLATE_THRESHOLD}). Immediate isolation mandated."
        )
    elif trust_score >= settings.TRUSTED_THRESHOLD:
        decision = "ALLOW"
        reason = f"Normal Access Granted: Trust score {trust_score}/100 exceeds trusted threshold ({settings.TRUSTED_THRESHOLD})."
    elif trust_score >= settings.MONITOR_THRESHOLD:
        decision = "MONITOR"
        reason = f"Elevated Monitoring Enacted: Trust score dropped to {trust_score}/100. Entity under active inspection."
    elif trust_score >= settings.RESTRICT_THRESHOLD:
        decision = "RESTRICT"
        reason = f"Network Traffic Restricted: Trust score dropped to {trust_score}/100. High-risk ports/protocols restricted."
    else:
        decision = "ISOLATE"
        reason = f"Zero Trust Boundary Breach: Trust score depleted to {trust_score}/100 (below {settings.RESTRICT_THRESHOLD}). Complete host isolation."

    evidence = (
        f"Entity: {entity_id} | Trust Score: {trust_score} | Behavior Risk: {behavior_risk} | "
        f"Trigger: {event.get('category', 'N/A')} ({event.get('rule_id', 'N/A')})"
    )

    zt_decision = ZeroTrustDecision(
        id=decision_id,
        timestamp=datetime.datetime.utcnow(),
        entity_id=entity_id,
        trust_score=trust_score,
        behavior_risk=behavior_risk,
        decision=decision,
        reason=reason,
        evidence=evidence,
        execution_status="SIMULATED",  # Default safety mode
        mode=mode,
        triggering_event_id=event.get("id")
    )
    db.add(zt_decision)
    db.commit()
    db.refresh(zt_decision)

    return zt_decision
