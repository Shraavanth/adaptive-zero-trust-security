import pytest
from app.detection.phishing_detector import check_phishing
from app.detection.arp_spoof_detector import ARPSpoofDetector
from app.detection.dns_spoof_detector import DNSSpoofDetector

def test_phishing_typosquat_detection():
    # Typosquatting brand "paypal" -> "paypa1-secure-login.com"
    res = check_phishing("paypa1-secure-login.com", {})
    assert res is not None
    assert res["category"] == "PHISHING"
    assert res["severity"] in ("HIGH", "CRITICAL")
    assert "paypa" in res["detection_reason"]

def test_phishing_punycode_detection():
    res = check_phishing("xn--pple-43d.com", {})
    assert res is not None
    assert res["category"] == "PHISHING"
    assert res["rule_id"] == "PHISH-RULE-002-PUNYCODE"

def test_phishing_benign_domain():
    # Benign domains must not be falsely flagged
    res1 = check_phishing("github.com", {})
    assert res1 is None
    res2 = check_phishing("wikipedia.org", {})
    assert res2 is None

def test_arp_spoof_gateway_mitm_detection():
    detector = ARPSpoofDetector()
    # Baseline registration for gateway 192.168.1.1
    legit_pkt = {
        "protocol": "ARP",
        "ip_version": "ARP",
        "arp_opcode": "reply",
        "arp_sender_ip": "192.168.1.1",
        "arp_sender_mac": "00:50:56:c0:00:08",
        "arp_target_ip": "192.168.1.100",
        "arp_target_mac": "aa:bb:cc:dd:ee:01"
    }
    detector.check_arp_packet(legit_pkt)

    # Attack packet: different MAC claims gateway IP 192.168.1.1!
    rogue_pkt = {
        "protocol": "ARP",
        "ip_version": "ARP",
        "arp_opcode": "reply",
        "arp_sender_ip": "192.168.1.1",
        "arp_sender_mac": "de:ad:be:ef:99:99",
        "arp_target_ip": "192.168.1.100",
        "arp_target_mac": "aa:bb:cc:dd:ee:01"
    }
    attack_res = detector.check_arp_packet(rogue_pkt)
    assert attack_res is not None
    assert attack_res["category"] == "ARP_SPOOFING"
    assert attack_res["severity"] == "CRITICAL"
    assert "Gateway impersonation" in attack_res["detection_reason"]

def test_dns_spoof_conflicting_response():
    detector = DNSSpoofDetector()
    query = "banking-portal.internal"

    # 1. Legitimate response from authorized upstream 1.1.1.1
    pkt1 = {
        "protocol": "DNS",
        "src_ip": "1.1.1.1",
        "src_port": 53,
        "dns_query": query,
        "dns_reply": "10.0.0.50",
        "ttl": 300
    }
    detector.check_dns_packet(pkt1)

    # 2. Rogue conflicting response from different resolver 192.168.1.200 answering conflicting IP
    pkt2 = {
        "protocol": "DNS",
        "src_ip": "192.168.1.200",
        "src_port": 53,
        "dns_query": query,
        "dns_reply": "198.51.100.99",
        "ttl": 300
    }
    res2 = detector.check_dns_packet(pkt2)
    assert res2 is not None
    assert res2["category"] == "DNS_SPOOFING"
    assert res2["severity"] in ("HIGH", "CRITICAL")
