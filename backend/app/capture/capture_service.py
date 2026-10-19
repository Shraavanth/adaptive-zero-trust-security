import uuid
import threading
import time
import datetime
import random
import logging
from typing import Optional, Dict, Any, List, Callable
from collections import deque
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.capture import CaptureSession, PacketRecord
from app.models.detection import SecurityEvent
from app.models.audit import AuditLog
from app.capture.packet_normalizer import normalize_raw_packet
from app.capture.tshark_engine import TSharkCaptureEngine
from app.capture.scapy_engine import ScapyCaptureEngine
from app.capture.interface_manager import find_tshark_executable
from app.detection.detection_service import detection_service
from app.trust.trust_engine import apply_event_penalty
from app.trust.behavior_risk import calculate_behavior_risk
from app.policies.policy_engine import evaluate_zero_trust_policy
from app.policies.repeat_offender import record_qualifying_incident
from app.response.response_engine import execute_response_action
from app.flows.flow_aggregator import process_packet_into_flow
from app.core.config import settings

logger = logging.getLogger("capture_service")

class CaptureService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CaptureService, cls).__new__(cls)
                cls._instance._init_service()
            return cls._instance

    def _init_service(self):
        self.active_session_id: Optional[str] = None
        self.current_interface: Optional[str] = None
        self.current_mode: str = settings.DEFAULT_CAPTURE_MODE
        self.engine: Optional[Any] = None
        self.is_capturing = False
        self.packet_buffer = deque(maxlen=settings.PACKET_BUFFER_LIMIT)
        self.listeners: List[Callable[[Dict[str, Any]], None]] = []
        self.sim_thread: Optional[threading.Thread] = None
        self.stats = {
            "total_packets": 0,
            "packets_per_sec": 0,
            "malicious_packets": 0,
            "clean_packets": 0
        }
        self._last_sec_count = 0
        self._last_sec_time = time.time()

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        if callback in self.listeners:
            self.listeners.remove(callback)

    def get_status(self) -> Dict[str, Any]:
        # Compute packets per second
        now = time.time()
        elapsed = now - self._last_sec_time
        if elapsed >= 1.0:
            current_count = self.stats["total_packets"]
            self.stats["packets_per_sec"] = max(0, int((current_count - self._last_sec_count) / elapsed))
            self._last_sec_count = current_count
            self._last_sec_time = now

        return {
            "is_capturing": self.is_capturing,
            "active_session_id": self.active_session_id,
            "current_interface": self.current_interface,
            "mode": self.current_mode,
            "stats": self.stats,
            "engine_type": "TShark" if isinstance(self.engine, TSharkCaptureEngine) else ("Scapy" if isinstance(self.engine, ScapyCaptureEngine) else "Simulated/Replay")
        }

    def start_capture(
        self,
        interface: str,
        mode: str = "LIVE_CAPTURE",
        bpf_filter: str = ""
    ) -> Dict[str, Any]:
        """
        Starts packet capture safely. If already capturing on the same interface, returns active session.
        """
        if mode == "CONTROLLED_LAB":
            raise ValueError(
                "Continuous lab capture is unavailable because no lab endpoints are configured; run an explicit scenario instead."
            )
        if mode not in ("LIVE_CAPTURE", "SIMULATED_TEST"):
            raise ValueError(f"Unsupported capture mode: {mode}")

        if self.is_capturing:
            if self.current_interface == interface and self.current_mode == mode:
                return {"status": "ALREADY_RUNNING", "session_id": self.active_session_id}
            else:
                self.stop_capture()

        session_id = f"SES-{uuid.uuid4().hex[:12].upper()}"
        self.active_session_id = session_id
        self.current_interface = interface
        self.current_mode = mode
        self.stats.update({
            "total_packets": 0,
            "packets_per_sec": 0,
            "malicious_packets": 0,
            "clean_packets": 0
        })
        self._last_sec_count = 0
        self._last_sec_time = time.time()

        # Persist session in DB
        db = SessionLocal()
        try:
            session_model = CaptureSession(
                id=session_id,
                start_time=datetime.datetime.utcnow(),
                mode=mode,
                interface_name=interface,
                status="ACTIVE",
                total_packets=0
            )
            db.add(session_model)
            db.commit()
        finally:
            db.close()

        self.is_capturing = True
        startup_error = None
        if mode == "LIVE_CAPTURE":
            tshark_bin = find_tshark_executable()
            if tshark_bin:
                self.engine = TSharkCaptureEngine(
                    interface=interface,
                    packet_callback=self._handle_raw_packet,
                    bpf_filter=bpf_filter
                )
                success = self.engine.start()
                if not success:
                    # Fallback to Scapy
                    self.engine = ScapyCaptureEngine(
                        interface=interface,
                        packet_callback=self._handle_raw_packet,
                        bpf_filter=bpf_filter
                    )
                    if not self.engine.start():
                        startup_error = self.engine.error_message or "Scapy capture engine failed to start."
            else:
                self.engine = ScapyCaptureEngine(
                    interface=interface,
                    packet_callback=self._handle_raw_packet,
                    bpf_filter=bpf_filter
                )
                if not self.engine.start():
                    startup_error = self.engine.error_message or "Scapy capture engine failed to start."

        elif mode == "SIMULATED_TEST":
            self.sim_thread = threading.Thread(target=self._run_simulation_worker, daemon=True)
            self.sim_thread.start()

        if startup_error:
            self.is_capturing = False
            if self.engine:
                self.engine.stop()
                self.engine = None
            self.active_session_id = None
            self.current_interface = None
            db = SessionLocal()
            try:
                failed_session = db.query(CaptureSession).filter(CaptureSession.id == session_id).first()
                if failed_session:
                    failed_session.status = "FAILED"
                    failed_session.end_time = datetime.datetime.utcnow()
                    failed_session.error_message = startup_error
                db.commit()
            finally:
                db.close()
            return {
                "status": "FAILED",
                "session_id": session_id,
                "mode": mode,
                "interface": interface,
                "error": startup_error
            }

        db = SessionLocal()
        try:
            db.add(AuditLog(
                id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
                timestamp=datetime.datetime.utcnow(),
                action="CAPTURE_STARTED",
                actor="OPERATOR",
                category="CAPTURE",
                target=interface,
                details=f"Packet capture session started in {mode} mode on interface {interface}.",
                status="SUCCESS"
            ))
            db.commit()
        finally:
            db.close()

        return {
            "status": "STARTED",
            "session_id": session_id,
            "mode": mode,
            "interface": interface
        }

    def stop_capture(self) -> Dict[str, Any]:
        """Stops the active capture session gracefully."""
        if not self.is_capturing:
            return {"status": "NOT_CAPTURING"}

        session_id = self.active_session_id
        self.is_capturing = False

        if self.engine:
            try:
                self.engine.stop()
            except Exception:
                pass
            self.engine = None

        db = SessionLocal()
        try:
            if session_id:
                s = db.query(CaptureSession).filter(CaptureSession.id == session_id).first()
                if s:
                    s.status = "STOPPED"
                    s.end_time = datetime.datetime.utcnow()
                    s.total_packets = self.stats["total_packets"]

            audit = AuditLog(
                id=f"AUD-{uuid.uuid4().hex[:12].upper()}",
                timestamp=datetime.datetime.utcnow(),
                action="CAPTURE_STOPPED",
                actor="OPERATOR",
                category="CAPTURE",
                target=self.current_interface or "N/A",
                details=f"Packet capture session {session_id} stopped. Total packets: {self.stats['total_packets']}.",
                status="SUCCESS"
            )
            db.add(audit)
            db.commit()
        finally:
            db.close()

        self.active_session_id = None
        self.current_interface = None
        return {"status": "STOPPED", "session_id": session_id}

    def _handle_raw_packet(self, raw_pkt: Dict[str, Any]):
        """Processes packets delivered by the active live or simulated capture."""
        if not self.is_capturing:
            return None

        session_id = self.active_session_id or "SES-UNKNOWN"
        interface = self.current_interface or "N/A"
        mode = self.current_mode
        return self.process_packet(raw_pkt, session_id, interface, mode)

    def process_packet(
        self,
        raw_pkt: Dict[str, Any],
        session_id: str,
        interface: str,
        mode: str
    ) -> Dict[str, Any]:
        """Analyze and persist a packet independently of live-capture state."""
        normalized = normalize_raw_packet(raw_pkt, session_id, interface, mode)

        # Threat Detection Pipeline
        threat_event = detection_service.analyze_packet(normalized)
        db = SessionLocal()
        try:
            if threat_event:
                normalized["detection_status"] = "MALICIOUS"
                normalized["related_event_id"] = threat_event["id"]
                self.stats["malicious_packets"] += 1

                # 1. Persist Security Event
                evt_model = SecurityEvent(**threat_event)
                db.add(evt_model)
                db.commit()

                # 2. Dynamic Trust Scoring Penalty
                entity_id = threat_event.get("src_ip", "N/A")
                device, hist = apply_event_penalty(db, threat_event)

                # 3. Behavior Risk Score
                risk_score = calculate_behavior_risk(db, entity_id, threat_event)

                # 4. Zero Trust Policy Evaluation
                current_trust = device.current_trust_score if device else 100
                decision = evaluate_zero_trust_policy(db, entity_id, threat_event, current_trust, risk_score, mode)

                # 5. Repeat Offender Tracking
                offender = record_qualifying_incident(db, entity_id, threat_event)

                # 6. Response Action
                if decision.decision in ("ISOLATE", "RESTRICT"):
                    execute_response_action(
                        db=db,
                        target_entity=entity_id,
                        action_type=decision.decision,
                        reason=decision.reason,
                        triggering_event_id=threat_event["id"],
                        policy_decision_id=decision.id,
                        mode="SIMULATED"
                    )
            else:
                self.stats["clean_packets"] += 1

            # 7. Aggregate Network Flows
            process_packet_into_flow(db, normalized)

            # 8. Persist Packet Record
            packet_rec = PacketRecord(**normalized)
            db.add(packet_rec)
            db.commit()
            db.refresh(packet_rec)
            normalized["id"] = packet_rec.id

        except Exception:
            db.rollback()
            logger.exception("Failed to process packet for session %s", session_id)
            raise
        finally:
            db.close()

        self.stats["total_packets"] += 1
        self.packet_buffer.append(normalized)

        # Broadcast to active SSE / WebSocket listeners
        for listener in list(self.listeners):
            try:
                listener(normalized)
            except Exception:
                logger.exception("Packet listener failed for session %s", session_id)
        return normalized

    def _run_simulation_worker(self):
        """Generates realistic enterprise network traffic and attacks for testing and UI demonstration."""
        sample_scenarios = [
            # Benign Web Traffic
            {"src_ip": "192.168.1.105", "dst_ip": "142.250.190.46", "protocol": "TCP", "src_port": 54210, "dst_port": 443, "length": 512, "tcp_flags": "PA"},
            {"src_ip": "192.168.1.110", "dst_ip": "104.16.132.229", "protocol": "TCP", "src_port": 49152, "dst_port": 80, "length": 256, "tcp_flags": "A"},
            {"src_ip": "192.168.1.105", "dst_ip": "8.8.8.8", "protocol": "DNS", "src_port": 58321, "dst_port": 53, "length": 78, "dns_query": "github.com", "dns_reply": "140.82.121.4"},
            # Benign ARP
            {"protocol": "ARP", "src_ip": "192.168.1.105", "dst_ip": "192.168.1.1", "src_mac": "00:1a:2b:3c:4d:5e", "dst_mac": "ff:ff:ff:ff:ff:ff", "arp_opcode": "request", "arp_sender_ip": "192.168.1.105", "arp_sender_mac": "00:1a:2b:3c:4d:5e", "arp_target_ip": "192.168.1.1", "arp_target_mac": "00:00:00:00:00:00", "length": 42},
            # Phishing Threat
            {"src_ip": "192.168.1.140", "dst_ip": "1.1.1.1", "protocol": "DNS", "src_port": 61200, "dst_port": 53, "length": 92, "dns_query": "paypa1-secure-login.com", "dns_reply": "198.51.100.44"},
            # ARP Spoofing Attack
            {"protocol": "ARP", "src_ip": "192.168.1.1", "dst_ip": "192.168.1.105", "src_mac": "de:ad:be:ef:00:99", "dst_mac": "00:1a:2b:3c:4d:5e", "arp_opcode": "reply", "arp_sender_ip": "192.168.1.1", "arp_sender_mac": "de:ad:be:ef:00:99", "arp_target_ip": "192.168.1.105", "arp_target_mac": "00:1a:2b:3c:4d:5e", "length": 42},
            # DNS Spoofing Threat
            {"src_ip": "192.168.1.88", "dst_ip": "192.168.1.105", "protocol": "DNS", "src_port": 53, "dst_port": 55123, "length": 86, "dns_query": "internal-bank.portal", "dns_reply": "203.0.113.10", "ttl": 1},
        ]

        idx = 0
        while self.is_capturing and self.current_mode == "SIMULATED_TEST":
            pkt_template = sample_scenarios[idx % len(sample_scenarios)].copy()
            pkt_template["timestamp"] = time.time()
            pkt_template["src_mac"] = pkt_template.get("src_mac", "00:1a:2b:3c:4d:5e")
            pkt_template["dst_mac"] = pkt_template.get("dst_mac", "00:50:56:c0:00:08")
            self._handle_raw_packet(pkt_template)
            idx += 1
            time.sleep(random.uniform(0.6, 1.2))

capture_service = CaptureService()
