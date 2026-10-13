import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent
DATA_DIR = WORKSPACE_DIR / "data"
LOGS_DIR = WORKSPACE_DIR / "logs"
REPORTS_DIR = WORKSPACE_DIR / "reports"

DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    APP_NAME: str = "Adaptive Zero Trust"
    TAGLINE: str = "Real-Time Network Threat Detection, Dynamic Trust and Intelligent Response"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database
    DATABASE_PATH: Path = DATA_DIR / "adaptive_zero_trust.db"
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH.as_posix()}"

    # Capture Settings
    DEFAULT_CAPTURE_MODE: str = "SIMULATED_TEST"  # LIVE_CAPTURE, OFFLINE_REPLAY, CONTROLLED_LAB, SIMULATED_TEST
    TSHARK_DEFAULT_PATH: str = r"C:\Program Files\Wireshark\tshark.exe"
    PACKET_BUFFER_LIMIT: int = 5000

    # Trust Scoring Rules
    INITIAL_TRUST_SCORE: int = 100
    PENALTY_INFORMATIONAL: int = 2
    PENALTY_PHISHING: int = 15
    PENALTY_DNS_SPOOFING: int = 25
    PENALTY_ARP_SPOOFING: int = 30

    # Trust Score Bands
    TRUSTED_THRESHOLD: int = 80   # 80 - 100: TRUSTED
    MONITOR_THRESHOLD: int = 60   # 60 - 79: MONITOR
    RESTRICT_THRESHOLD: int = 30  # 30 - 59: RESTRICT
    # 0 - 29: ISOLATE

    # Behavior-Risk Thresholds
    RISK_ISOLATE_THRESHOLD: int = 70  # Risk score >= 70 triggers immediate isolation override

    # Self-Healing Prerequisites
    RECOVERY_CLEAN_WINDOW_SECONDS: int = 300  # 5 minutes without malicious event
    RECOVERY_MIN_TRUST_SCORE: int = 80
    RECOVERY_MAX_RISK_SCORE: int = 69
    AUTO_HEALING_ENABLED: bool = True

    # Security & Lab controls
    AUTHORIZED_RESPONSE_MODE: str = "SIMULATED"  # SIMULATED (default) or AUTHORIZED_LAB
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

settings = Settings()
