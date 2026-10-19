import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index
from app.database.session import Base

class SelfHealingPlan(Base):
    __tablename__ = "self_healing_plans"

    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), index=True, nullable=False)
    status = Column(String(32), default="EVALUATING", index=True, nullable=False)  # EVALUATING, ELIGIBLE, BLOCKED, APPROVED, EXECUTING, SIMULATED, RECOVERED, FAILED
    reason = Column(Text, nullable=False)
    prerequisites_satisfied = Column(Boolean, default=False, nullable=False)
    prerequisites_breakdown = Column(Text, default="{}", nullable=False)  # JSON details of 5m clean check, trust check, risk check, repeat offender check
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    executed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    verification_details = Column(Text, nullable=True)
    rollback_performed = Column(Boolean, default=False, nullable=False)
    recovery_time_seconds = Column(Float, nullable=True)


class SelfHealingLog(Base):
    __tablename__ = "self_healing_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    plan_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    step_name = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)  # SUCCESS, FAILED, WARNING, INFO
    details = Column(Text, nullable=False)
