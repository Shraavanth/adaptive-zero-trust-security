import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from app.database.session import Base

class NetworkFlow(Base):
    __tablename__ = "network_flows"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    src_ip = Column(String(64), index=True, nullable=False)
    dst_ip = Column(String(64), index=True, nullable=False)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    protocol = Column(String(16), default="TCP", nullable=False)
    packet_count = Column(Integer, default=1, nullable=False)
    byte_count = Column(Integer, default=0, nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    state = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, CLOSED, TIMED_OUT
    linked_event_id = Column(String(64), nullable=True)
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)

Index("idx_flows_endpoints", NetworkFlow.src_ip, NetworkFlow.dst_ip, NetworkFlow.protocol)
