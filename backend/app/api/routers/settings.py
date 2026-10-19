from typing import Literal
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.settings import SystemSetting
from app.core.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])
logger = logging.getLogger("settings")

DEFAULT_CONFIGS = {
    "trust_initial_score": str(settings.INITIAL_TRUST_SCORE),
    "penalty_informational": str(settings.PENALTY_INFORMATIONAL),
    "penalty_phishing": str(settings.PENALTY_PHISHING),
    "penalty_dns_spoofing": str(settings.PENALTY_DNS_SPOOFING),
    "penalty_arp_spoofing": str(settings.PENALTY_ARP_SPOOFING),
    "behavior_risk_isolate_threshold": str(settings.RISK_ISOLATE_THRESHOLD),
    "recovery_clean_window_seconds": str(settings.RECOVERY_CLEAN_WINDOW_SECONDS),
    "recovery_min_trust_score": str(settings.RECOVERY_MIN_TRUST_SCORE),
    "recovery_max_risk_score": str(settings.RECOVERY_MAX_RISK_SCORE),
    "privacy_masking_enabled": "true",
    "authorized_response_mode": settings.AUTHORIZED_RESPONSE_MODE,
    "auto_healing_enabled": str(settings.AUTO_HEALING_ENABLED).lower(),
    "packet_buffer_limit": str(settings.PACKET_BUFFER_LIMIT)
}


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    trust_initial_score: int | None = Field(default=None, ge=0, le=100)
    penalty_informational: int | None = Field(default=None, ge=0, le=100)
    penalty_phishing: int | None = Field(default=None, ge=0, le=100)
    penalty_dns_spoofing: int | None = Field(default=None, ge=0, le=100)
    penalty_arp_spoofing: int | None = Field(default=None, ge=0, le=100)
    behavior_risk_isolate_threshold: int | None = Field(default=None, ge=0, le=100)
    recovery_clean_window_seconds: int | None = Field(default=None, ge=1, le=86400)
    recovery_min_trust_score: int | None = Field(default=None, ge=0, le=100)
    recovery_max_risk_score: int | None = Field(default=None, ge=0, le=100)
    privacy_masking_enabled: bool | None = None
    authorized_response_mode: Literal["SIMULATED"] | None = None
    auto_healing_enabled: bool | None = None
    packet_buffer_limit: int | None = Field(default=None, ge=1, le=100000)


RUNTIME_SETTINGS = {
    "trust_initial_score": "INITIAL_TRUST_SCORE",
    "penalty_informational": "PENALTY_INFORMATIONAL",
    "penalty_phishing": "PENALTY_PHISHING",
    "penalty_dns_spoofing": "PENALTY_DNS_SPOOFING",
    "penalty_arp_spoofing": "PENALTY_ARP_SPOOFING",
    "behavior_risk_isolate_threshold": "RISK_ISOLATE_THRESHOLD",
    "recovery_clean_window_seconds": "RECOVERY_CLEAN_WINDOW_SECONDS",
    "recovery_min_trust_score": "RECOVERY_MIN_TRUST_SCORE",
    "recovery_max_risk_score": "RECOVERY_MAX_RISK_SCORE",
    "auto_healing_enabled": "AUTO_HEALING_ENABLED",
    "packet_buffer_limit": "PACKET_BUFFER_LIMIT",
}


def apply_runtime_settings(values):
    for key, value in values.items():
        attribute = RUNTIME_SETTINGS.get(key)
        if attribute:
            setattr(settings, attribute, value)

    if "packet_buffer_limit" in values:
        from app.capture.capture_service import capture_service
        from collections import deque

        capture_service.packet_buffer = deque(
            capture_service.packet_buffer,
            maxlen=settings.PACKET_BUFFER_LIMIT
        )


def load_persisted_settings(db: Session):
    current_map = {row.key: row.value for row in db.query(SystemSetting).all()}
    if (
        current_map.get("authorized_response_mode")
        and current_map["authorized_response_mode"] != "SIMULATED"
    ):
        current_map["authorized_response_mode"] = "SIMULATED"
        db.query(SystemSetting).filter(
            SystemSetting.key == "authorized_response_mode"
        ).update({"value": "SIMULATED"})
        db.commit()
        logger.warning(
            "Reset unsupported persisted response mode to SIMULATED; real network enforcement is unavailable."
        )
    supported_values = {
        key: value for key, value in current_map.items()
        if key in SettingsUpdate.model_fields
    }
    parsed = SettingsUpdate.model_validate(supported_values).model_dump(
        exclude_unset=True,
        exclude_none=True
    )
    apply_runtime_settings(parsed)


@router.get("")
def get_all_settings(db: Session = Depends(get_db)):
    db_settings = db.query(SystemSetting).all()
    current_map = {s.key: s.value for s in db_settings}

    result = DEFAULT_CONFIGS.copy()
    result.update(current_map)
    return result

@router.put("")
def update_settings(updates: SettingsUpdate, db: Session = Depends(get_db)):
    values = updates.model_dump(exclude_unset=True, exclude_none=True)
    if (
        values.get("recovery_max_risk_score", settings.RECOVERY_MAX_RISK_SCORE)
        >= values.get("behavior_risk_isolate_threshold", settings.RISK_ISOLATE_THRESHOLD)
    ):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=422,
            detail="recovery_max_risk_score must be below behavior_risk_isolate_threshold."
        )

    persisted_values = {
        key: str(value).lower() if isinstance(value, bool) else str(value)
        for key, value in values.items()
    }
    for key, val in persisted_values.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = val
        else:
            new_s = SystemSetting(key=key, value=val, description=f"Configured property {key}")
            db.add(new_s)
    db.commit()
    apply_runtime_settings(values)
    return {"status": "UPDATED", "keys_updated": list(persisted_values.keys())}
