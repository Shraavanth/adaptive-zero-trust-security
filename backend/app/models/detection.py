import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from app.database.session import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    category = Column(String(32), nullable=False, index=True)  # PHISHING, ARP_SPOOFING, DNS_SPOOFING, PORT_SCAN, ANOMALY, INFORMATIONAL
    severity = Column(String(16), default="MEDIUM", nullable=False, index=True)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85, nullable=False)
    src_ip = Column(String(64), default="N/A", index=True, nullable=False)
    dst_ip = Column(String(64), default="N/A", index=True, nullable=False)
    src_mac = Column(String(32), default="N/A", nullable=False)
    dst_mac = Column(String(32), default="N/A", nullable=False)
    domain = Column(String(256), nullable=True, index=True)
    protocol = Column(String(16), default="IP", nullable=False)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=False)
    detection_reason = Column(Text, nullable=False)
    rule_id = Column(String(64), nullable=False)
    risk_score = Column(Integer, default=50, nullable=False)
    related_packet_id = Column(Integer, nullable=True)
    session_id = Column(String(64), nullable=True)
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)
    recommended_response = Column(String(32), default="MONITOR", nullable=False)  # ALLOW, MONITOR, RESTRICT, ISOLATE
    investigation_status = Column(String(32), default="OPEN", index=True, nullable=False)  # OPEN, IN_PROGRESS, RESOLVED, FALSE_POSITIVE

Index("idx_events_category_severity", SecurityEvent.category, SecurityEvent.severity)


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    status = Column(String(32), default="OPEN", index=True, nullable=False)  # OPEN, INVESTIGATING, CLOSED
    priority = Column(String(16), default="MEDIUM", nullable=False)
    analyst = Column(String(64), default="SecOps Analyst", nullable=False)
    notes = Column(Text, default="", nullable=False)
    evidence_links = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
