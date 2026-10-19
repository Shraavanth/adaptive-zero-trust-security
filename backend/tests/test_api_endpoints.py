import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.database.session import SessionLocal
from app.models.audit import AuditLog
from app.models.detection import SecurityEvent
from app.models.policy import ZeroTrustDecision
from app.models.response import IsolationRecord, ResponseAction
from app.response.response_engine import execute_response_action

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "Adaptive Zero Trust" in data["app_name"]

def test_api_diagnostics():
    res = client.get("/api/diagnostics")
    assert res.status_code == 200
    data = res.json()
    assert data["backend_status"] == "ONLINE"
    assert "database_status" in data
    assert "tshark_installed" in data
    assert "npcap_installed" in data

def test_api_interfaces():
    res = client.get("/api/capture/interfaces")
    assert res.status_code == 200
    ifs = res.json()
    assert isinstance(ifs, list)
    assert len(ifs) > 0
    assert "id" in ifs[0]
    assert "name" in ifs[0]

def test_api_capture_lifecycle():
    # 1. Start capture in SIMULATED_TEST mode
    start_res = client.post("/api/capture/start", json={
        "interface_name": "Software Loopback Interface 1",
        "mode": "SIMULATED_TEST"
    })
    assert start_res.status_code == 200
    assert start_res.json()["status"] in ("STARTED", "ALREADY_RUNNING")

    # 2. Check status
    stat_res = client.get("/api/capture/status")
    assert stat_res.status_code == 200
    assert stat_res.json()["is_capturing"] is True

    # 3. Stop capture
    stop_res = client.post("/api/capture/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] in ("STOPPED", "NOT_CAPTURING")

def test_api_packets_and_filtering():
    res = client.get("/api/packets?limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_api_run_scenario():
    res = client.post("/api/testing/run-scenario", json={
        "scenario_id": "BENIGN_TRAFFIC",
        "target_ip": "192.168.1.188"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_name"] == "BENIGN_TRAFFIC"
    assert data["status"] == "PASSED"

@pytest.mark.parametrize(
    "scenario_id",
    ["PHISHING_ATTACK", "ARP_SPOOF_ATTACK", "DNS_SPOOF_ATTACK"]
)
def test_api_attack_scenarios_verify_persisted_detection(scenario_id):
    res = client.post("/api/testing/run-scenario", json={
        "scenario_id": scenario_id,
        "target_ip": "198.51.100.203"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PASSED"
    assert "Detected" in data["actual_outcome"]
    assert "trust penalty" in data["actual_outcome"]
    assert "policy:" in data["actual_outcome"]

def test_api_settings_update():
    original_score = settings.INITIAL_TRUST_SCORE
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200

    put_res = client.put("/api/settings", json={"trust_initial_score": 87})
    assert put_res.status_code == 200
    assert "trust_initial_score" in put_res.json()["keys_updated"]
    assert settings.INITIAL_TRUST_SCORE == 87

    restore_res = client.put("/api/settings", json={"trust_initial_score": original_score})
    assert restore_res.status_code == 200

    enforcement_res = client.put("/api/settings", json={
        "authorized_response_mode": "AUTHORIZED_LAB"
    })
    assert enforcement_res.status_code == 422

def test_incident_evidence_timeline_and_response_preview_are_persisted_and_read_only():
    target_ip = "198.51.100.204"
    scenario = client.post("/api/testing/run-scenario", json={
        "scenario_id": "PHISHING_ATTACK",
        "target_ip": target_ip
    })
    assert scenario.status_code == 200
    assert scenario.json()["status"] == "PASSED"

    db = SessionLocal()
    try:
        event = db.query(SecurityEvent).filter(
            SecurityEvent.src_ip == target_ip
        ).order_by(SecurityEvent.timestamp.desc()).first()
        assert event is not None
        decision = db.query(ZeroTrustDecision).filter(
            ZeroTrustDecision.triggering_event_id == event.id
        ).first()
        assert decision is not None
        execute_response_action(
            db,
            target_ip,
            "RESTRICT",
            "Test evidence correlation",
            triggering_event_id=event.id,
            policy_decision_id=decision.id,
        )
        event_id = event.id
    finally:
        db.close()

    evidence_res = client.get(f"/api/threats/{event_id}/evidence")
    assert evidence_res.status_code == 200
    evidence = evidence_res.json()
    assert evidence["event"]["id"] == event_id
    assert evidence["packet"]["related_event_id"] == event_id
    assert evidence["trust_history"][0]["event_id"] == event_id
    assert evidence["policy_decisions"][0]["triggering_event_id"] == event_id
    assert evidence["response_actions"][0]["triggering_event_id"] == event_id
    assert [entry["timestamp"] for entry in evidence["timeline"]] == sorted(
        entry["timestamp"] for entry in evidence["timeline"]
    )
    assert {entry["record_type"] for entry in evidence["timeline"]} == {
        "DETECTION", "PACKET", "TRUST", "POLICY", "RESPONSE"
    }

    db = SessionLocal()
    try:
        before = (
            db.query(ResponseAction).count(),
            db.query(IsolationRecord).count(),
            db.query(AuditLog).count(),
        )
    finally:
        db.close()

    preview_res = client.post("/api/response/preview", json={
        "target_entity": target_ip,
        "action_type": "ISOLATE",
        "reason": "Validate a response preview"
    })
    assert preview_res.status_code == 200
    preview = preview_res.json()
    assert preview["would_mutate_state"] is False
    assert preview["execution_mode"] == "SIMULATED"
    assert preview["rollback_action"] == "RELEASE"
    assert "not a transactional rollback" in preview["rollback_limitations"]

    db = SessionLocal()
    try:
        after = (
            db.query(ResponseAction).count(),
            db.query(IsolationRecord).count(),
            db.query(AuditLog).count(),
        )
    finally:
        db.close()
    assert after == before
