import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from app.database.session import Base

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(String(64), primary_key=True, index=True)
    target_entity = Column(String(64), index=True, nullable=False)
    action_type = Column(String(32), nullable=False)  # ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE
    triggering_event_id = Column(String(64), nullable=True)
    policy_decision_id = Column(String(64), nullable=True)
    requested_operation = Column(String(64), nullable=False)
    execution_mode = Column(String(32), default="SIMULATED", nullable=False)  # SIMULATED, AUTHORIZED_LAB
    execution_status = Column(String(32), default="PENDING", index=True, nullable=False)  # PENDING, SIMULATED, EXECUTED, FAILED, ROLLED_BACK
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    result_details = Column(Text, default="", nullable=False)
    error_message = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    rollback_status = Column(String(32), default="NONE", nullable=False)  # NONE, AVAILABLE, EXECUTED, FAILED


class IsolationRecord(Base):
    __tablename__ = "isolation_records"

    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), index=True, nullable=False)
    isolation_type = Column(String(32), default="HOST_QUARANTINE", nullable=False)
    isolated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    released_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="ISOLATED", index=True, nullable=False)  # ISOLATED, SIMULATED, RELEASED
    release_reason = Column(Text, nullable=True)
    execution_mode = Column(String(32), default="SIMULATED", nullable=False)
