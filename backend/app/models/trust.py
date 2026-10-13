import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from app.database.session import Base

class DeviceTrust(Base):
    __tablename__ = "device_trust"

    entity_id = Column(String(64), primary_key=True, index=True)  # IP address or MAC address
    ip_address = Column(String(64), default="N/A", index=True, nullable=False)
    mac_address = Column(String(32), default="N/A", index=True, nullable=False)
    current_trust_score = Column(Integer, default=100, nullable=False)  # 0 to 100
    behavior_risk_score = Column(Integer, default=0, nullable=False)    # 0 to 100
    state = Column(String(32), default="TRUSTED", index=True, nullable=False)  # TRUSTED, MONITOR, RESTRICT, ISOLATE
    total_incidents = Column(Integer, default=0, nullable=False)
    last_penalty_reason = Column(Text, nullable=True)
    last_evaluated = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class TrustHistory(Base):
    __tablename__ = "trust_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    entity_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    previous_score = Column(Integer, nullable=False)
    new_score = Column(Integer, nullable=False)
    penalty_applied = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    event_id = Column(String(64), nullable=True, index=True)

Index("idx_trust_history_entity_time", TrustHistory.entity_id, TrustHistory.timestamp)
