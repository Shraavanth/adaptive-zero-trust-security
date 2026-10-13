import pytest
from datetime import datetime
from app.capture.packet_normalizer import normalize_raw_packet

def test_ipv4_packet_normalization():
    raw = {
        "timestamp": 1710000000.0,
        "src_ip": "192.168.1.50",
        "dst_ip": "142.250.190.46",
        "src_mac": "00:11:22:33:44:55",
        "dst_mac": "66:77:88:99:aa:bb",
        "protocol": "TCP",
        "src_port": 54321,
        "dst_port": 443,
        "length": 1500,
        "tcp_flags": "A",
        "ttl": 64
    }
    res = normalize_raw_packet(raw, session_id="TEST-SES", interface="eth0", mode="LIVE_CAPTURE")
    assert res["ip_version"] == "IPv4"
    assert res["src_ip"] == "192.168.1.50"
    assert res["dst_ip"] == "142.250.190.46"
    assert res["protocol"] == "TCP"
    assert res["src_port"] == 54321
    assert res["dst_port"] == 443
    assert res["length"] == 1500
    assert res["ttl"] == 64
    assert res["mode"] == "LIVE_CAPTURE"

def test_ipv6_packet_normalization():
    raw = {
        "timestamp": 1710000001.0,
        "src_ip": "2001:db8::1",
        "dst_ip": "2001:db8::2",
        "src_mac": "00:11:22:33:44:55",
        "dst_mac": "66:77:88:99:aa:bb",
        "protocol": "UDP",
        "src_port": 5353,
        "dst_port": 5353,
        "length": 80,
        "ttl": 255
    }
    res = normalize_raw_packet(raw, session_id="TEST-SES", interface="eth0", mode="LIVE_CAPTURE")
    assert res["ip_version"] == "IPv6"
    assert res["src_ip"] == "2001:db8::1"
    assert res["dst_ip"] == "2001:db8::2"
    assert res["protocol"] == "UDP"

def test_arp_field_extraction():
    raw = {
        "timestamp": 1710000002.0,
        "protocol": "ARP",
        "arp_opcode": "reply",
        "arp_sender_mac": "aa:bb:cc:dd:ee:ff",
        "arp_sender_ip": "192.168.1.1",
        "arp_target_mac": "00:11:22:33:44:55",
        "arp_target_ip": "192.168.1.50",
        "length": 42
    }
    res = normalize_raw_packet(raw, session_id="TEST-SES", interface="eth0", mode="LIVE_CAPTURE")
    assert res["ip_version"] == "ARP"
    assert res["protocol"] == "ARP"
    assert res["arp_opcode"] == "reply"
    assert res["arp_sender_ip"] == "192.168.1.1"
    assert res["arp_sender_mac"] == "aa:bb:cc:dd:ee:ff"
    assert res["arp_target_ip"] == "192.168.1.50"
    assert res["arp_target_mac"] == "00:11:22:33:44:55"
    assert res["src_ip"] == "192.168.1.1"
    assert res["dst_ip"] == "192.168.1.50"

def test_dns_feature_extraction():
    raw = {
        "timestamp": 1710000003.0,
        "src_ip": "192.168.1.50",
        "dst_ip": "8.8.8.8",
        "protocol": "DNS",
        "src_port": 52123,
        "dst_port": 53,
        "dns_query": "example.com",
        "dns_reply": "93.184.216.34",
        "length": 78
    }
    res = normalize_raw_packet(raw, session_id="TEST-SES", interface="eth0", mode="LIVE_CAPTURE")
    assert res["dns_query"] == "example.com"
    assert res["dns_reply"] == "93.184.216.34"
    assert res["protocol"] == "DNS"
