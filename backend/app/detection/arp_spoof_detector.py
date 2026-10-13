import time
from typing import Optional, Dict, Any

class ARPSpoofDetector:
    def __init__(self):
        # Baseline mapping: ip -> {"mac": mac, "first_seen": ts, "last_seen": ts}
        self.ip_mac_table: Dict[str, Dict[str, Any]] = {}
        # Trusted gateway mapping: e.g. 192.168.1.1 -> original mac
        self.gateway_ip: Optional[str] = "192.168.1.1"

    def check_arp_packet(self, packet: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyzes an ARP packet for spoofing, cache poisoning, and gateway impersonation.
        """
        protocol = str(packet.get("protocol", "")).upper()
        if protocol != "ARP" and packet.get("ip_version") != "ARP":
            return None

        sender_ip = packet.get("arp_sender_ip") or packet.get("src_ip")
        sender_mac = packet.get("arp_sender_mac") or packet.get("src_mac")
        target_ip = packet.get("arp_target_ip") or packet.get("dst_ip")
        opcode = str(packet.get("arp_opcode", "")).lower()

        if not sender_ip or not sender_mac or sender_ip == "N/A" or sender_mac == "N/A":
            return None
        if sender_mac == "00:00:00:00:00:00" or sender_mac.lower() == "ff:ff:ff:ff:ff:ff":
            return None

        now = time.time()

        # Check existing baseline
        if sender_ip in self.ip_mac_table:
            known_entry = self.ip_mac_table[sender_ip]
            known_mac = known_entry["mac"]

            if known_mac.lower() != sender_mac.lower():
                # Conflict detected! An IP address is being claimed by a different MAC address!
                is_gateway = (sender_ip == self.gateway_ip)
                severity = "CRITICAL" if is_gateway else "HIGH"
                confidence = 0.95 if opcode in ("reply", "2") else 0.88
                rule_id = "ARP-SPOOF-001-GATEWAY-MITM" if is_gateway else "ARP-SPOOF-002-MAC-CONFLICT"

                reason = (
                    f"Gateway impersonation (MITM) detected! Default gateway {sender_ip} previously mapped to "
                    f"{known_mac} is now claimed by {sender_mac}."
                    if is_gateway else
                    f"ARP cache poisoning anomaly: IP {sender_ip} previously bound to {known_mac} is now advertised by {sender_mac}."
                )

                evidence = (
                    f"ARP Opcode: {opcode or 'reply'}, Sender IP: {sender_ip}, "
                    f"Original MAC: {known_mac}, Conflicting MAC: {sender_mac}, Target IP: {target_ip or 'Broadcast'}."
                )

                return {
                    "category": "ARP_SPOOFING",
                    "severity": severity,
                    "confidence": confidence,
                    "rule_id": rule_id,
                    "detection_reason": reason,
                    "evidence": evidence,
                    "risk_score": 90 if is_gateway else 80,
                    "recommended_response": "ISOLATE"
                }
            else:
                # Update last seen timestamp
                known_entry["last_seen"] = now
        else:
            # Register new baseline mapping
            self.ip_mac_table[sender_ip] = {
                "mac": sender_mac,
                "first_seen": now,
                "last_seen": now
            }

        # Gratuitous ARP announcement check (sender IP == target IP with opcode reply)
        if sender_ip == target_ip and opcode in ("reply", "2"):
            return {
                "category": "ARP_SPOOFING",
                "severity": "MEDIUM",
                "confidence": 0.70,
                "rule_id": "ARP-SPOOF-003-GRATUITOUS-ANNOUNCEMENT",
                "detection_reason": f"Gratuitous ARP broadcast received from {sender_mac} for IP {sender_ip}. Monitored for cache preemption.",
                "evidence": f"Unsolicited ARP reply broadcasting ownership of {sender_ip} across local subnet.",
                "risk_score": 55,
                "recommended_response": "MONITOR"
            }

        return None

arp_detector = ARPSpoofDetector()
