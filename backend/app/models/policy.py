import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from app.database.session import Base

class ZeroTrustDecision(Base):
    __tablename__ = "zero_trust_decisions"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    entity_id = Column(String(64), index=True, nullable=False)
    trust_score = Column(Integer, nullable=False)
    behavior_risk = Column(Integer, nullable=False)
    decision = Column(String(32), nullable=False, index=True)  # ALLOW, MONITOR, RESTRICT, ISOLATE
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    execution_status = Column(String(32), default="SIMULATED", nullable=False)  # ENFORCED, SIMULATED, PENDING, REVERTED
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)
    triggering_event_id = Column(String(64), nullable=True)


class RepeatOffender(Base):
    __tablename__ = "repeat_offenders"

    entity_id = Column(String(64), primary_key=True, index=True)
    ip_address = Column(String(64), default="N/A", nullable=False)
    mac_address = Column(String(32), default="N/A", nullable=False)
    qualifying_incident_count = Column(Integer, default=1, nullable=False)
    escalation_state = Column(String(32), default="ACTIVE", index=True, nullable=False)  # ACTIVE, ENHANCED_MONITORING, EXTENDED_QUARANTINE, PERMANENT_BLOCK
    first_incident_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_incident_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    attack_categories = Column(Text, default="", nullable=False)  # comma separated or json
    notes = Column(Text, nullable=True)
