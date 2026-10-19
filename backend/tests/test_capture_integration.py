import os
import json
from io import StringIO
from types import SimpleNamespace

from fastapi.testclient import TestClient

import app.capture.capture_service as capture_service_module
import app.capture.tshark_engine as tshark_engine_module
import app.capture.interface_manager as interface_manager_module
from app.api.routers import capture as capture_router
from app.capture.capture_service import capture_service
from app.database.session import SessionLocal
from app.main import app
from app.models.capture import CaptureSession, PacketRecord

client = TestClient(app)


def test_offline_replay_processes_packets_without_active_capture(monkeypatch):
    if capture_service.is_capturing:
        capture_service.stop_capture()
    observed_path = None

    def replay(file_path, session_id, packet_callback):
        nonlocal observed_path
        observed_path = file_path
        packet_callback({
            "timestamp": 1710000000.0,
            "src_ip": "198.51.100.55",
            "dst_ip": "1.1.1.1",
            "protocol": "DNS",
            "src_port": 51000,
            "dst_port": 53,
            "length": 72,
            "dns_query": "example.org",
            "dns_reply": "93.184.216.34"
        })
        return 1

    monkeypatch.setattr(capture_router, "replay_pcap_file", replay)
    response = client.post(
        "/api/capture/upload-pcap",
        files={"file": ("sample.PCAP", b"pcap bytes", "application/vnd.tcpdump.pcap")}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["packets_replayed"] == 1
    assert observed_path is not None and not os.path.exists(observed_path)
    assert capture_service.is_capturing is False

    db = SessionLocal()
    try:
        session = db.query(CaptureSession).filter(CaptureSession.id == payload["session_id"]).one()
        packet = db.query(PacketRecord).filter(PacketRecord.session_id == payload["session_id"]).one()
        assert session.status == "STOPPED"
        assert packet.mode == "OFFLINE_REPLAY"
        assert packet.src_ip == "198.51.100.55"
    finally:
        db.close()


def test_offline_replay_rejects_oversized_upload(monkeypatch):
    monkeypatch.setattr(capture_router, "MAX_PCAP_UPLOAD_BYTES", 1)
    response = client.post(
        "/api/capture/upload-pcap",
        files={"file": ("large.pcap", b"too large", "application/vnd.tcpdump.pcap")}
    )
    assert response.status_code == 413


def test_offline_replay_failure_hides_internal_error_and_cleans_up(monkeypatch):
    observed = {}

    def fail_replay(file_path, session_id, packet_callback):
        observed["path"] = file_path
        observed["session_id"] = session_id
        raise RuntimeError("Parser failed at C:\\private\\capture.pcap")

    monkeypatch.setattr(capture_router, "replay_pcap_file", fail_replay)
    response = client.post(
        "/api/capture/upload-pcap",
        files={"file": ("sample.pcap", b"pcap bytes", "application/vnd.tcpdump.pcap")}
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "PCAP replay failed. Check server logs for details."
    assert "C:\\private" not in response.text
    assert observed["path"] is not None and not os.path.exists(observed["path"])

    db = SessionLocal()
    try:
        session = db.query(CaptureSession).filter(
            CaptureSession.id == observed["session_id"]
        ).one()
        assert session.status == "FAILED"
        assert session.error_message == "Offline PCAP replay failed. See server logs for details."
    finally:
        db.close()


def test_live_capture_start_reports_engine_failure(monkeypatch):
    if capture_service.is_capturing:
        capture_service.stop_capture()

    class FailingEngine:
        error_message = "Capture permission denied"

        def __init__(self, **kwargs):
            pass

        def start(self):
            return False

        def stop(self):
            pass

    monkeypatch.setattr(capture_service_module, "find_tshark_executable", lambda: None)
    monkeypatch.setattr(capture_service_module, "ScapyCaptureEngine", FailingEngine)
    response = client.post("/api/capture/start", json={
        "interface_name": "test-interface",
        "mode": "LIVE_CAPTURE"
    })
    assert response.status_code == 503
    assert "Capture permission denied" in response.json()["detail"]
    assert capture_service.is_capturing is False
    assert capture_service.active_session_id is None


def test_controlled_lab_requires_explicit_scenario():
    if capture_service.is_capturing:
        capture_service.stop_capture()
    response = client.post("/api/capture/start", json={
        "interface_name": "test-interface",
        "mode": "CONTROLLED_LAB"
    })
    assert response.status_code == 400
    assert "run an explicit scenario" in response.json()["detail"]


def test_capture_start_bounds_interface_and_filter_inputs():
    empty_interface = client.post("/api/capture/start", json={
        "interface_name": "",
        "mode": "SIMULATED_TEST"
    })
    oversized_filter = client.post("/api/capture/start", json={
        "interface_name": "test-interface",
        "mode": "SIMULATED_TEST",
        "bpf_filter": "x" * 2049
    })

    assert empty_interface.status_code == 422
    assert oversized_filter.status_code == 422


def test_interface_discovery_does_not_claim_capture_permission(monkeypatch):
    commands = []

    def run(command, **kwargs):
        commands.append(command)
        return SimpleNamespace(
            returncode=0,
            stdout=json.dumps([{
                "Name": "Adapter",
                "InterfaceDescription": "Test Adapter",
                "MacAddress": "00:11:22:33:44:55",
                "Status": "Up",
                "InterfaceType": "Ethernet",
                "ifIndex": "1; Start-Process calc"
            }])
        )

    monkeypatch.setattr(interface_manager_module.platform, "system", lambda: "Windows")
    monkeypatch.setattr(interface_manager_module, "get_tshark_interfaces", lambda: {})
    monkeypatch.setattr(interface_manager_module, "check_npcap_installed", lambda: True)
    monkeypatch.setattr(interface_manager_module.subprocess, "run", run)
    monkeypatch.setattr(
        interface_manager_module.subprocess, "CREATE_NO_WINDOW", 0, raising=False
    )

    interfaces = interface_manager_module.discover_network_interfaces()

    assert len(interfaces) == 1
    assert interfaces[0].permission_status == "Capture permission not verified (Npcap detected)"
    assert len(commands) == 1


def test_tshark_parser_splits_tab_separated_fields(monkeypatch):
    values = [
        "1710000000.0", "192.0.2.1", "192.0.2.2", "", "",
        "00:11:22:33:44:55", "66:77:88:99:aa:bb", "DNS", "", "",
        "53000", "53", "78", "", "example.org", "93.184.216.34",
        "", "", "", "", "", "64"
    ]
    engine = tshark_engine_module.TSharkCaptureEngine("test", lambda packet: None)
    captured = []
    engine.packet_callback = captured.append
    engine.process = SimpleNamespace(stdout=StringIO("\t".join(values) + "\n"))
    engine.is_running = True
    monkeypatch.setattr(engine, "stop", lambda: None)

    engine._read_stream()

    assert captured[0]["src_ip"] == "192.0.2.1"
    assert captured[0]["dst_ip"] == "192.0.2.2"
    assert captured[0]["protocol"] == "DNS"
    assert captured[0]["src_port"] == "53000"
    assert captured[0]["dns_query"] == "example.org"
    assert captured[0]["ttl"] == 64
