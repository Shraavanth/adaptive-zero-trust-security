import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from app.database.session import Base

class HoneypotInstance(Base):
    __tablename__ = "honeypot_instances"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    service_type = Column(String(64), nullable=False)  # HTTP_PHISHING_TRAP, SSH_DECOY, DNS_SINKHOLE, TELNET_TRAP
    port = Column(Integer, nullable=False)
    ip_address = Column(String(64), default="127.0.0.1", nullable=False)
    status = Column(String(32), default="RUNNING", index=True, nullable=False)  # RUNNING, STOPPED, ALERTING
    interaction_count = Column(Integer, default=0, nullable=False)
    mode = Column(String(32), default="SIMULATED", nullable=False)  # SIMULATED, AUTHORIZED_LAB
    deployed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_interaction = Column(DateTime, nullable=True)
    health_status = Column(String(32), default="HEALTHY", nullable=False)


class HoneypotEvent(Base):
    __tablename__ = "honeypot_events"

    id = Column(String(64), primary_key=True, index=True)
    honeypot_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    src_ip = Column(String(64), index=True, nullable=False)
    src_port = Column(Integer, nullable=True)
    interaction_type = Column(String(64), nullable=False)  # PROBE, CREDENTIAL_HARVEST_ATTEMPT, BRUTE_FORCE, DNS_RECURSION
    payload_snippet = Column(Text, nullable=True)
    threat_level = Column(String(16), default="HIGH", nullable=False)
    linked_event_id = Column(String(64), nullable=True)
    mode = Column(String(32), default="SIMULATED", nullable=False)
