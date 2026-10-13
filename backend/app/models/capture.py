import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from app.database.session import Base

class CaptureSession(Base):
    __tablename__ = "capture_sessions"

    id = Column(String(64), primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)  # LIVE_CAPTURE, OFFLINE_REPLAY, CONTROLLED_LAB, SIMULATED_TEST
    interface_name = Column(String(128), default="N/A", nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, STOPPED, FAILED
    total_packets = Column(Integer, default=0, nullable=False)
    file_path = Column(String(256), nullable=True)
    error_message = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class PacketRecord(Base):
    __tablename__ = "packet_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    src_ip = Column(String(64), default="N/A", index=True, nullable=False)
    dst_ip = Column(String(64), default="N/A", index=True, nullable=False)
    src_mac = Column(String(32), default="N/A", index=True, nullable=False)
    dst_mac = Column(String(32), default="N/A", index=True, nullable=False)
    protocol = Column(String(16), default="OTHER", index=True, nullable=False)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    length = Column(Integer, default=0, nullable=False)
    ip_version = Column(String(8), default="IPv4", nullable=False)  # IPv4, IPv6, ARP
    tcp_flags = Column(String(32), nullable=True)
    dns_query = Column(String(256), nullable=True, index=True)
    dns_reply = Column(Text, nullable=True)
    arp_opcode = Column(String(16), nullable=True)
    arp_sender_mac = Column(String(32), nullable=True)
    arp_sender_ip = Column(String(64), nullable=True)
    arp_target_mac = Column(String(32), nullable=True)
    arp_target_ip = Column(String(64), nullable=True)
    ttl = Column(Integer, nullable=True)
    interface = Column(String(128), default="N/A", nullable=False)
    detection_status = Column(String(32), default="CLEAN", index=True, nullable=False)  # CLEAN, SUSPICIOUS, MALICIOUS
    related_event_id = Column(String(64), nullable=True, index=True)
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)

Index("idx_packets_src_dst", PacketRecord.src_ip, PacketRecord.dst_ip)
Index("idx_packets_timestamp", PacketRecord.timestamp)
