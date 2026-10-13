import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.detection.phishing_detector import check_phishing
from app.detection.arp_spoof_detector import arp_detector
from app.detection.dns_spoof_detector import dns_detector

class DetectionService:
    def __init__(self):
        # Port scan tracker: (src_ip) -> list of (dst_port, timestamp)
        self.port_scan_history: Dict[str, List[tuple]] = {}

    def analyze_packet(self, packet: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Runs all cybersecurity threat detection modules against the packet.
        Returns a structured SecurityEvent dict if a threat is identified.
        """
        # 1. Phishing & lookalike domain analysis
        domain = packet.get("dns_query")
        if domain:
            phish_result = check_phishing(domain, packet)
            if phish_result:
                return self._build_event(phish_result, packet)

        # 2. ARP spoofing and MITM analysis
        if packet.get("protocol") == "ARP" or packet.get("ip_version") == "ARP":
            arp_result = arp_detector.check_arp_packet(packet)
            if arp_result:
                return self._build_event(arp_result, packet)

        # 3. DNS spoofing and cache poisoning analysis
        if packet.get("protocol") == "DNS" or packet.get("src_port") == 53 or packet.get("dst_port") == 53:
            dns_result = dns_detector.check_dns_packet(packet)
            if dns_result:
                return self._build_event(dns_result, packet)

        # 4. Reconnaissance / Port Scan heuristic
        src_ip = packet.get("src_ip")
        dst_port = packet.get("dst_port")
        tcp_flags = str(packet.get("tcp_flags", ""))
        if src_ip and src_ip != "N/A" and dst_port and "S" in tcp_flags and "A" not in tcp_flags:
            now = datetime.utcnow().timestamp()
            if src_ip not in self.port_scan_history:
                self.port_scan_history[src_ip] = []
            
            history = [p for p in self.port_scan_history[src_ip] if (now - p[1]) < 30]
            history.append((dst_port, now))
            self.port_scan_history[src_ip] = history

            unique_ports = len({p[0] for p in history})
            if unique_ports >= 8:
                return self._build_event({
                    "category": "PORT_SCAN",
                    "severity": "HIGH",
                    "confidence": 0.85,
                    "rule_id": "RECON-RULE-001-SYN-SCAN",
                    "detection_reason": f"Horizontal/vertical SYN port scanning detected from {src_ip} ({unique_ports} target ports in 30s).",
                    "evidence": f"Rapid TCP SYN probes dispatched without connection completion across multiple ports.",
                    "risk_score": 75,
                    "recommended_response": "RESTRICT"
                }, packet)

        return None

    def _build_event(self, threat_data: Dict[str, Any], packet: Dict[str, Any]) -> Dict[str, Any]:
        event_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"
        return {
            "id": event_id,
            "timestamp": packet.get("timestamp", datetime.utcnow()),
            "category": threat_data["category"],
            "severity": threat_data["severity"],
            "confidence": threat_data.get("confidence", 0.85),
            "src_ip": packet.get("src_ip", "N/A"),
            "dst_ip": packet.get("dst_ip", "N/A"),
            "src_mac": packet.get("src_mac", "N/A"),
            "dst_mac": packet.get("dst_mac", "N/A"),
            "domain": threat_data.get("domain") or packet.get("dns_query"),
            "protocol": packet.get("protocol", "IP"),
            "src_port": packet.get("src_port"),
            "dst_port": packet.get("dst_port"),
            "evidence": threat_data["evidence"],
            "detection_reason": threat_data["detection_reason"],
            "rule_id": threat_data["rule_id"],
            "risk_score": threat_data.get("risk_score", 60),
            "related_packet_id": packet.get("id"),
            "session_id": packet.get("session_id"),
            "mode": packet.get("mode", "LIVE_CAPTURE"),
            "recommended_response": threat_data.get("recommended_response", "MONITOR"),
            "investigation_status": "OPEN"
        }

detection_service = DetectionService()
