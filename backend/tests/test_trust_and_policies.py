import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.trust import DeviceTrust, TrustHistory
from app.trust.trust_engine import apply_event_penalty, determine_trust_state
from app.trust.behavior_risk import calculate_behavior_risk
from app.policies.policy_engine import evaluate_zero_trust_policy
from app.policies.repeat_offender import record_qualifying_incident

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_trust_state_bands():
    assert determine_trust_state(100) == "TRUSTED"
    assert determine_trust_state(80) == "TRUSTED"
    assert determine_trust_state(79) == "MONITOR"
    assert determine_trust_state(60) == "MONITOR"
    assert determine_trust_state(59) == "RESTRICT"
    assert determine_trust_state(30) == "RESTRICT"
    assert determine_trust_state(29) == "ISOLATE"
    assert determine_trust_state(0) == "ISOLATE"

def test_trust_penalty_and_idempotency(db_session):
    # 1. Phishing event penalty (-15)
    evt = {
        "id": "EVT-PHISH-01",
        "src_ip": "192.168.1.150",
        "src_mac": "00:11:22:33:44:55",
        "category": "PHISHING",
        "detection_reason": "Typosquatting observed"
    }
    dev, hist = apply_event_penalty(db_session, evt)
    assert dev.current_trust_score == 85
    assert dev.state == "TRUSTED"
    assert hist.penalty_applied == 15

    # 2. Idempotency test: Re-submitting the same event ID must not penalize again
    dev2, hist2 = apply_event_penalty(db_session, evt)
    assert dev2.current_trust_score == 85
    assert hist2 is None  # No duplicate history or score reduction

    # 3. ARP spoofing penalty (-30) drops score from 85 to 55 (RESTRICT)
    evt2 = {
        "id": "EVT-ARP-02",
        "src_ip": "192.168.1.150",
        "src_mac": "00:11:22:33:44:55",
        "category": "ARP_SPOOFING",
        "detection_reason": "Gateway MITM observed"
    }
    dev3, hist3 = apply_event_penalty(db_session, evt2)
    assert dev3.current_trust_score == 55
    assert dev3.state == "RESTRICT"

def test_zero_trust_policy_evaluation(db_session):
    evt = {"id": "EVT-01", "category": "INFORMATIONAL"}
    # High trust, low risk -> ALLOW
    dec1 = evaluate_zero_trust_policy(db_session, "192.168.1.100", evt, trust_score=95, behavior_risk=10)
    assert dec1.decision == "ALLOW"

    # Moderate trust -> MONITOR
    dec2 = evaluate_zero_trust_policy(db_session, "192.168.1.100", evt, trust_score=70, behavior_risk=20)
    assert dec2.decision == "MONITOR"

    # Degraded trust -> RESTRICT
    dec3 = evaluate_zero_trust_policy(db_session, "192.168.1.100", evt, trust_score=45, behavior_risk=30)
    assert dec3.decision == "RESTRICT"

    # Depleted trust -> ISOLATE
    dec4 = evaluate_zero_trust_policy(db_session, "192.168.1.100", evt, trust_score=20, behavior_risk=40)
    assert dec4.decision == "ISOLATE"

    # Behavior risk >= 70 override -> ISOLATE even if trust score is 90!
    dec5 = evaluate_zero_trust_policy(db_session, "192.168.1.100", evt, trust_score=90, behavior_risk=75)
    assert dec5.decision == "ISOLATE"
    assert "Risk Score Override" in dec5.reason

def test_repeat_offender_escalation_lifecycle(db_session):
    target = "192.168.1.222"
    # 1st incident -> ACTIVE
    off1 = record_qualifying_incident(db_session, target, {"src_ip": target, "category": "PHISHING"})
    assert off1.qualifying_incident_count == 1
    assert off1.escalation_state == "ACTIVE"

    # 2nd incident -> ENHANCED_MONITORING
    off2 = record_qualifying_incident(db_session, target, {"src_ip": target, "category": "DNS_SPOOFING"})
    assert off2.qualifying_incident_count == 2
    assert off2.escalation_state == "ENHANCED_MONITORING"

    # 3rd incident -> EXTENDED_QUARANTINE
    off3 = record_qualifying_incident(db_session, target, {"src_ip": target, "category": "ARP_SPOOFING"})
    assert off3.qualifying_incident_count == 3
    assert off3.escalation_state == "EXTENDED_QUARANTINE"

    # 4th incident -> PERMANENT_BLOCK
    off4 = record_qualifying_incident(db_session, target, {"src_ip": target, "category": "PHISHING"})
    assert off4.qualifying_incident_count == 4
    assert off4.escalation_state == "PERMANENT_BLOCK"
