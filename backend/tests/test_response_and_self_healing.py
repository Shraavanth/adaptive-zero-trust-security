import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.trust import DeviceTrust
from app.models.detection import SecurityEvent
from app.models.policy import RepeatOffender
from app.models.response import IsolationRecord, ResponseAction
from app.response.response_engine import execute_response_action
from app.self_healing.self_healing_engine import evaluate_recovery_prerequisites, generate_and_execute_recovery_plan

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_response_isolation_and_release(db_session):
    target = "192.168.1.180"
    # 1. Execute ISOLATE
    action = execute_response_action(db_session, target, "ISOLATE", "Threat containment", mode="SIMULATED")
    assert action.action_type == "ISOLATE"
    assert action.execution_status == "SIMULATED"
    assert action.is_verified is False

    iso = db_session.query(IsolationRecord).filter(IsolationRecord.entity_id == target).first()
    assert iso is not None
    assert iso.status == "SIMULATED"

    # 2. Execute RELEASE
    rel_action = execute_response_action(db_session, target, "RELEASE", "Operator release", mode="SIMULATED")
    assert rel_action.action_type == "RELEASE"

    iso_updated = db_session.query(IsolationRecord).filter(IsolationRecord.entity_id == target).first()
    assert iso_updated.status == "RELEASED"

    with pytest.raises(ValueError, match="Real network enforcement is not implemented"):
        execute_response_action(
            db_session,
            target,
            "ISOLATE",
            "Explicit lab mode is not implemented",
            mode="AUTHORIZED_LAB"
        )

def test_self_healing_blocked_by_recent_malicious_event(db_session):
    target = "192.168.1.190"
    # Add malicious event within last 1 minute
    recent_evt = SecurityEvent(
        id="EVT-RECENT-01",
        timestamp=datetime.datetime.utcnow(),
        category="PHISHING",
        severity="HIGH",
        confidence=0.9,
        src_ip=target,
        dst_ip="1.1.1.1",
        src_mac="00:11:22:33:44:55",
        dst_mac="66:77:88:99:aa:bb",
        protocol="DNS",
        evidence="Lookalike query",
        detection_reason="Phishing",
        rule_id="RULE-01",
        risk_score=60,
        mode="SIMULATED_TEST",
        recommended_response="RESTRICT",
        investigation_status="OPEN"
    )
    db_session.add(recent_evt)
    db_session.commit()

    satisfied, breakdown = evaluate_recovery_prerequisites(db_session, target)
    assert satisfied is False
    assert breakdown["clean_window_satisfied"] is False
    assert "Blocked" in breakdown["clean_window_details"]

def test_self_healing_blocked_by_permanent_block(db_session):
    target = "192.168.1.191"
    # Offender in PERMANENT_BLOCK state
    off = RepeatOffender(
        entity_id=target,
        ip_address=target,
        mac_address="00:11:22:33:44:55",
        qualifying_incident_count=4,
        escalation_state="PERMANENT_BLOCK",
        first_incident_time=datetime.datetime.utcnow(),
        last_incident_time=datetime.datetime.utcnow(),
        attack_categories="PHISHING,ARP_SPOOFING"
    )
    db_session.add(off)
    db_session.commit()

    satisfied, breakdown = evaluate_recovery_prerequisites(db_session, target)
    assert satisfied is False
    assert breakdown["repeat_policy_satisfied"] is False

def test_self_healing_permitted_and_executed(db_session):
    target = "192.168.1.195"
    # Device with high trust and low risk
    dev = DeviceTrust(
        entity_id=target,
        ip_address=target,
        mac_address="00:11:22:33:44:55",
        current_trust_score=90,
        behavior_risk_score=15,
        state="ISOLATE",
        total_incidents=0,
        last_evaluated=datetime.datetime.utcnow(),
        created_at=datetime.datetime.utcnow(),
        is_active=True
    )
    db_session.add(dev)

    # Initial quarantine record
    iso = IsolationRecord(
        id="ISO-TEST-01",
        entity_id=target,
        isolation_type="HOST_QUARANTINE",
        status="ISOLATED",
        isolated_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    )
    db_session.add(iso)
    db_session.commit()

    # Prerequisites should pass!
    satisfied, breakdown = evaluate_recovery_prerequisites(db_session, target)
    assert satisfied is True
    assert breakdown["clean_window_satisfied"] is True
    assert breakdown["trust_score_satisfied"] is True
    assert breakdown["behavior_risk_satisfied"] is True
    assert breakdown["repeat_policy_satisfied"] is True

    # Execute recovery plan
    plan = generate_and_execute_recovery_plan(db_session, target, auto_execute=True)
    assert plan.status == "SIMULATED"
    assert plan.verified is False
    assert "not modified or verified" in plan.verification_details.lower()
    assert plan.recovery_time_seconds is not None

    # Isolation must be revoked
    iso_check = db_session.query(IsolationRecord).filter(IsolationRecord.entity_id == target).first()
    assert iso_check.status == "RELEASED"
