import time
from typing import Optional, Dict, Any, List

class DNSSpoofDetector:
    def __init__(self):
        # Query history: domain -> list of {"resolver_ip": str, "resolved_ip": str, "ttl": int, "timestamp": float}
        self.resolution_cache: Dict[str, List[Dict[str, Any]]] = {}
        # Authorized upstream DNS resolvers (e.g. 1.1.1.1, 8.8.8.8, 9.9.9.9, default gateway)
        self.authorized_resolvers = {"1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4", "9.9.9.9", "127.0.0.1", "192.168.1.1"}

    def check_dns_packet(self, packet: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detects DNS spoofing, cache poisoning, unauthorized resolver answers, and anomalous TTLs.
        """
        protocol = str(packet.get("protocol", "")).upper()
        if protocol != "DNS" and packet.get("src_port") != 53 and packet.get("dst_port") != 53:
            return None

        dns_query = packet.get("dns_query")
        dns_reply = packet.get("dns_reply")
        src_ip = packet.get("src_ip", "N/A")
        ttl = packet.get("ttl")

        if not dns_query or not dns_reply:
            return None

        clean_query = dns_query.lower().rstrip(".")
        now = time.time()

        # Check resolver legitimacy: is the DNS response coming from port 53 of an unexpected local IP?
        if packet.get("src_port") == 53 and src_ip not in self.authorized_resolvers and not src_ip.startswith("10.") and not src_ip.startswith("192.168."):
            pass  # Public resolver not explicitly in list is acceptable, but let's check for private rogue resolver:
        elif packet.get("src_port") == 53 and src_ip.startswith("192.168.") and src_ip != "192.168.1.1":
            return {
                "category": "DNS_SPOOFING",
                "severity": "HIGH",
                "confidence": 0.88,
                "rule_id": "DNS-SPOOF-001-ROGUE-RESOLVER",
                "domain": clean_query,
                "detection_reason": f"DNS response originated from unexpected local host {src_ip} masquerading as internal resolver.",
                "evidence": f"Query: {clean_query}, Resolver: {src_ip}:53, Answer: {dns_reply}.",
                "risk_score": 75,
                "recommended_response": "RESTRICT"
            }

        # Check for TTL anomaly (e.g., TTL = 0 or 1 on sensitive domain response)
        if ttl is not None and ttl <= 1 and any(kw in clean_query for kw in ["bank", "login", "auth", "portal"]):
            return {
                "category": "DNS_SPOOFING",
                "severity": "MEDIUM",
                "confidence": 0.78,
                "rule_id": "DNS-SPOOF-002-SUSPICIOUS-TTL",
                "domain": clean_query,
                "detection_reason": f"Anomalously low TTL ({ttl}s) observed for critical service resolution {clean_query}.",
                "evidence": f"DNS Answer: {dns_reply} with near-zero TTL, commonly utilized in fast-flux phishing rotation or transient injection.",
                "risk_score": 65,
                "recommended_response": "MONITOR"
            }

        # Cache inspection for conflicting resolutions within a 60-second window
        if clean_query not in self.resolution_cache:
            self.resolution_cache[clean_query] = []

        history = self.resolution_cache[clean_query]
        # Purge entries older than 120s
        history = [entry for entry in history if (now - entry["timestamp"]) < 120]
        self.resolution_cache[clean_query] = history

        # Check for conflicting answers from different resolvers
        for prior in history:
            if prior["resolved_ip"] != dns_reply and prior["resolver_ip"] != src_ip:
                # Same query returned conflicting IPs from different resolvers!
                return {
                    "category": "DNS_SPOOFING",
                    "severity": "HIGH",
                    "confidence": 0.90,
                    "rule_id": "DNS-SPOOF-003-CONFLICTING-RESPONSE",
                    "domain": clean_query,
                    "detection_reason": f"Conflicting DNS resolution detected for {clean_query}: {prior['resolved_ip']} vs {dns_reply}.",
                    "evidence": f"Prior Resolver ({prior['resolver_ip']}) answered '{prior['resolved_ip']}', while Current Resolver ({src_ip}) answered '{dns_reply}'.",
                    "risk_score": 85,
                    "recommended_response": "ISOLATE"
                }

        self.resolution_cache[clean_query].append({
            "resolver_ip": src_ip,
            "resolved_ip": str(dns_reply),
            "ttl": ttl or 300,
            "timestamp": now
        })

        return None

dns_detector = DNSSpoofDetector()
