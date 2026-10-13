from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.settings import SystemSetting
from app.core.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

DEFAULT_CONFIGS = {
    "trust_initial_score": "100",
    "penalty_informational": "2",
    "penalty_phishing": "15",
    "penalty_dns_spoofing": "25",
    "penalty_arp_spoofing": "30",
    "behavior_risk_isolate_threshold": "70",
    "recovery_clean_window_seconds": "300",
    "recovery_min_trust_score": "80",
    "privacy_masking_enabled": "true",
    "authorized_response_mode": "SIMULATED",
    "auto_healing_enabled": "true",
    "packet_buffer_limit": "5000"
}

@router.get("")
def get_all_settings(db: Session = Depends(get_db)):
    db_settings = db.query(SystemSetting).all()
    current_map = {s.key: s.value for s in db_settings}

    # Merge with defaults
    result = DEFAULT_CONFIGS.copy()
    result.update(current_map)
    return result

@router.put("")
def update_settings(updates: Dict[str, str], db: Session = Depends(get_db)):
    for key, val in updates.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = str(val)
        else:
            new_s = SystemSetting(key=key, value=str(val), description=f"Configured property {key}")
            db.add(new_s)
    db.commit()
    return {"status": "UPDATED", "keys_updated": list(updates.keys())}
