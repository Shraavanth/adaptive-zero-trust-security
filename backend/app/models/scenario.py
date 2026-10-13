import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database.session import Base

class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id = Column(String(64), primary_key=True, index=True)
    scenario_name = Column(String(128), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    mode = Column(String(32), default="SIMULATED_TEST", nullable=False)
    expected_outcome = Column(Text, nullable=False)
    actual_outcome = Column(Text, nullable=False)
    status = Column(String(32), default="PASSED", nullable=False)  # PASSED, FAILED
    duration_ms = Column(Float, default=0.0, nullable=False)
    details = Column(Text, nullable=True)
