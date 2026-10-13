import os
import time
import logging
from typing import Callable, Dict, Any, List
from app.capture.packet_normalizer import normalize_raw_packet

logger = logging.getLogger("offline_replay")

def replay_pcap_file(
    file_path: str,
    session_id: str,
    packet_callback: Callable[[Dict[str, Any]], None],
    max_packets: int = 2000
) -> int:
    """
    Reads packets from an uploaded PCAP or PCAPNG file and processes them
    with mode strictly set to OFFLINE_REPLAY.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PCAP file not found: {file_path}")

    from scapy.all import rdpcap
    from scapy.layers.inet import IP, TCP, UDP
    from scapy.layers.inet6 import IPv6
    from scapy.layers.l2 import Ether, ARP
    from scapy.layers.dns import DNS, DNSQR, DNSRR

    packets = rdpcap(file_path, count=max_packets)
    count = 0

    for pkt in packets:
        src_ip = "N/A"
        dst_ip = "N/A"
        src_mac = "N/A"
        dst_mac = "N/A"
        protocol = "OTHER"
        src_port = None
        dst_port = None
        ip_version = "IPv4"
        ttl = None
        tcp_flags = None
        dns_query = None
        dns_reply = None
        arp_opcode = None
        arp_smac = None
        arp_sip = None
        arp_tmac = None
        arp_tip = None

        if pkt.haslayer(Ether):
            src_mac = pkt[Ether].src
            dst_mac = pkt[Ether].dst

        if pkt.haslayer(IP):
            src_ip = pkt[IP].src
            dst_ip = pkt[IP].dst
            ip_version = "IPv4"
            ttl = pkt[IP].ttl
            protocol = pkt[IP].sprintf("%IP.proto%")
        elif pkt.haslayer(IPv6):
            src_ip = pkt[IPv6].src
            dst_ip = pkt[IPv6].dst
            ip_version = "IPv6"
            ttl = pkt[IPv6].hlim
            protocol = pkt[IPv6].sprintf("%IPv6.nh%")
        elif pkt.haslayer(ARP):
            ip_version = "ARP"
            protocol = "ARP"
            arp_layer = pkt[ARP]
            arp_opcode = "request" if arp_layer.op == 1 else ("reply" if arp_layer.op == 2 else str(arp_layer.op))
            arp_smac = arp_layer.hwsrc
            arp_sip = arp_layer.psrc
            arp_tmac = arp_layer.hwdst
            arp_tip = arp_layer.pdst
            src_ip = arp_sip
            dst_ip = arp_tip
            src_mac = arp_smac
            dst_mac = arp_tmac

        if pkt.haslayer(TCP):
            protocol = "TCP"
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
            tcp_flags = str(pkt[TCP].flags)
        elif pkt.haslayer(UDP):
            protocol = "UDP"
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport

        if pkt.haslayer(DNS):
            protocol = "DNS"
            dns_layer = pkt[DNS]
            if dns_layer.haslayer(DNSQR) and dns_layer.qd:
                try:
                    dns_query = dns_layer.qd.qname.decode("utf-8", errors="ignore").rstrip(".")
                except Exception:
                    pass
            if dns_layer.haslayer(DNSRR) and dns_layer.an:
                try:
                    dns_reply = str(dns_layer.an.rdata)
                except Exception:
                    pass

        raw_dict = {
            "timestamp": float(pkt.time),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_mac": src_mac,
            "dst_mac": dst_mac,
            "protocol": protocol,
            "src_port": src_port,
            "dst_port": dst_port,
            "length": len(pkt),
            "ip_version": ip_version,
            "tcp_flags": tcp_flags,
            "dns_query": dns_query,
            "dns_reply": dns_reply,
            "arp_opcode": arp_opcode,
            "arp_sender_mac": arp_smac,
            "arp_sender_ip": arp_sip,
            "arp_target_mac": arp_tmac,
            "arp_target_ip": arp_tip,
            "ttl": ttl,
            "mode": "OFFLINE_REPLAY"
        }

        normalized = normalize_raw_packet(raw_dict, session_id, "PCAP_FILE", mode="OFFLINE_REPLAY")
        packet_callback(normalized)
        count += 1

    return count
