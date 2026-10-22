import os
from pathlib import Path
from typing import List
from pydantic import BaseModel
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent

# Vercel functions have a read-only filesystem except for /tmp.
IS_VERCEL = os.getenv("VERCEL") == "1"

if IS_VERCEL:
    DATA_DIR = Path("/tmp/zero-trust-data")
    LOGS_DIR = Path("/tmp/zero-trust-logs")
    REPORTS_DIR = Path("/tmp/zero-trust-reports")
else:
    DATA_DIR = WORKSPACE_DIR / "data"
    LOGS_DIR = WORKSPACE_DIR / "logs"
    REPORTS_DIR = WORKSPACE_DIR / "reports"

# Create directories
for directory in (DATA_DIR, LOGS_DIR, REPORTS_DIR):
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass


def _get_allowed_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    env_origins = os.getenv("ALLOWED_ORIGINS")
    if env_origins:
        parsed = [o.strip() for o in env_origins.split(",") if o.strip()]
        for o in parsed:
            if o not in default_origins:
                default_origins.append(o)
    return default_origins


class Settings(BaseModel):
    APP_NAME: str = "Adaptive Zero Trust"
    TAGLINE: str = (
        "Real-Time Network Threat Detection, Dynamic Trust "
        "and Intelligent Response"
    )
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_PATH: Path = DATA_DIR / "adaptive_zero_trust.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL") or f"sqlite:///{DATABASE_PATH.as_posix()}"

    # Capture Settings
    DEFAULT_CAPTURE_MODE: str = os.getenv("DEFAULT_CAPTURE_MODE", "SIMULATED_TEST")
    TSHARK_DEFAULT_PATH: str = os.getenv(
        "TSHARK_PATH",
        r"C:\Program Files\Wireshark\tshark.exe"
    )
    PACKET_BUFFER_LIMIT: int = int(os.getenv("PACKET_BUFFER_LIMIT", "5000"))

    # Trust Scoring Rules
    INITIAL_TRUST_SCORE: int = int(os.getenv("TRUST_INITIAL_SCORE", "100"))
    PENALTY_INFORMATIONAL: int = int(os.getenv("TRUST_PENALTY_INFO", "2"))
    PENALTY_PHISHING: int = int(os.getenv("TRUST_PENALTY_PHISHING", "15"))
    PENALTY_DNS_SPOOFING: int = int(os.getenv("TRUST_PENALTY_DNS_SPOOF", "25"))
    PENALTY_ARP_SPOOFING: int = int(os.getenv("TRUST_PENALTY_ARP_SPOOF", "30"))

    # Trust Score Bands
    TRUSTED_THRESHOLD: int = 80
    MONITOR_THRESHOLD: int = 60
    RESTRICT_THRESHOLD: int = 30

    # Behavior-Risk Thresholds
    RISK_ISOLATE_THRESHOLD: int = int(os.getenv("BEHAVIOR_RISK_ISOLATE_THRESHOLD", "70"))

    # Self-Healing Prerequisites
    RECOVERY_CLEAN_WINDOW_SECONDS: int = int(os.getenv("RECOVERY_COOLDOWN_MINUTES", "5")) * 60
    RECOVERY_MIN_TRUST_SCORE: int = int(os.getenv("RECOVERY_MIN_TRUST", "80"))
    RECOVERY_MAX_RISK_SCORE: int = int(os.getenv("RECOVERY_MAX_RISK", "69"))
    AUTO_HEALING_ENABLED: bool = os.getenv("AUTO_RECOVERY_ENABLED", "True").lower() in ("true", "1", "t")

    # Security and Lab Controls
    AUTHORIZED_RESPONSE_MODE: str = os.getenv("RESPONSE_MODE", "SIMULATED")

    ALLOWED_ORIGINS: List[str] = _get_allowed_origins()


settings = Settings()