import pytest
from fastapi.testclient import TestClient
from app.main import app

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

def test_api_settings_update():
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200

    put_res = client.put("/api/settings", json={"trust_initial_score": "100"})
    assert put_res.status_code == 200
    assert "trust_initial_score" in put_res.json()["keys_updated"]
