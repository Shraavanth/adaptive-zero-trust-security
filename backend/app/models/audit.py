import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)  # ISOLATION_ENFORCED, TRUST_SCORE_UPDATED, RECOVERY_EXECUTED, CAPTURE_STARTED, etc.
    actor = Column(String(64), default="SYSTEM_AUTOMATION", nullable=False)
    category = Column(String(32), default="SECURITY_DECISION", nullable=False)
    target = Column(String(64), default="N/A", nullable=False)
    details = Column(Text, nullable=False)
    status = Column(String(32), default="SUCCESS", nullable=False)

Index("idx_audit_action_target", AuditLog.action, AuditLog.target)
