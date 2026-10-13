from typing import Dict, Any, Optional
from datetime import datetime

def normalize_raw_packet(
    raw_data: Dict[str, Any],
    session_id: str,
    interface: str,
    mode: str = "LIVE_CAPTURE"
) -> Dict[str, Any]:
    """
    Normalizes diverse packet inputs (TShark fields, Scapy packets, replay, or test events)
    into a strictly validated, consistent schema for database persistence and UI display.
    """
    ts = raw_data.get("timestamp")
    if isinstance(ts, str):
        try:
            timestamp = datetime.fromisoformat(ts)
        except Exception:
            timestamp = datetime.utcnow()
    elif isinstance(ts, (int, float)):
        timestamp = datetime.utcfromtimestamp(ts)
    elif isinstance(ts, datetime):
        timestamp = ts
    else:
        timestamp = datetime.utcnow()

    # Determine IP version / protocol family
    ip_version = raw_data.get("ip_version")
    src_ip = raw_data.get("src_ip", "N/A")
    dst_ip = raw_data.get("dst_ip", "N/A")
    src_mac = raw_data.get("src_mac", "N/A")
    dst_mac = raw_data.get("dst_mac", "N/A")
    protocol = str(raw_data.get("protocol", "OTHER")).upper()

    arp_opcode = raw_data.get("arp_opcode")
    arp_sender_mac = raw_data.get("arp_sender_mac")
    arp_sender_ip = raw_data.get("arp_sender_ip")
    arp_target_mac = raw_data.get("arp_target_mac")
    arp_target_ip = raw_data.get("arp_target_ip")

    if arp_opcode or protocol == "ARP":
        ip_version = "ARP"
        protocol = "ARP"
        # For ARP packets, keep IP as N/A unless sender/target are explicitly set in ARP fields
        if src_ip == "N/A" and arp_sender_ip:
            src_ip = arp_sender_ip
        if dst_ip == "N/A" and arp_target_ip:
            dst_ip = arp_target_ip
    elif not ip_version:
        if ":" in str(src_ip) or ":" in str(dst_ip):
            ip_version = "IPv6"
        elif "." in str(src_ip) and "." in str(dst_ip):
            ip_version = "IPv4"
        else:
            ip_version = "IPv4"

    def clean_port(val) -> Optional[int]:
        if val is None or val == "" or str(val).lower() == "none" or str(val).lower() == "n/a":
            return None
        try:
            p = int(val)
            return p if 0 <= p <= 65535 else None
        except (ValueError, TypeError):
            return None

    src_port = clean_port(raw_data.get("src_port"))
    dst_port = clean_port(raw_data.get("dst_port"))

    length = int(raw_data.get("length", 0))
    tcp_flags = raw_data.get("tcp_flags")
    dns_query = raw_data.get("dns_query")
    dns_reply = raw_data.get("dns_reply")

    ttl = None
    if raw_data.get("ttl") is not None:
        try:
            ttl = int(raw_data["ttl"])
        except (ValueError, TypeError):
            pass

    return {
        "session_id": session_id,
        "timestamp": timestamp,
        "src_ip": src_ip if src_ip else "N/A",
        "dst_ip": dst_ip if dst_ip else "N/A",
        "src_mac": src_mac if src_mac else "N/A",
        "dst_mac": dst_mac if dst_mac else "N/A",
        "protocol": protocol,
        "src_port": src_port,
        "dst_port": dst_port,
        "length": length,
        "ip_version": ip_version,
        "tcp_flags": tcp_flags,
        "dns_query": dns_query,
        "dns_reply": dns_reply,
        "arp_opcode": arp_opcode,
        "arp_sender_mac": arp_sender_mac,
        "arp_sender_ip": arp_sender_ip,
        "arp_target_mac": arp_target_mac,
        "arp_target_ip": arp_target_ip,
        "ttl": ttl,
        "interface": interface,
        "detection_status": raw_data.get("detection_status", "CLEAN"),
        "related_event_id": raw_data.get("related_event_id"),
        "mode": mode
    }
