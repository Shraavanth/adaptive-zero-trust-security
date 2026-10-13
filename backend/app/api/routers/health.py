import os
import subprocess
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.capture.interface_manager import find_tshark_executable, check_npcap_installed
from app.capture.capture_service import capture_service
from app.models.capture import PacketRecord
from app.models.detection import SecurityEvent

router = APIRouter(prefix="/api", tags=["Health & Diagnostics"])

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@router.get("/diagnostics")
def get_diagnostics(db: Session = Depends(get_db)):
    tshark_path = find_tshark_executable()
    tshark_installed = tshark_path is not None
    tshark_version = "Unavailable"

    if tshark_installed:
        try:
            res = subprocess.run([tshark_path, "--version"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                tshark_version = res.stdout.splitlines()[0]
        except Exception:
            tshark_version = "Installed (Version check timed out)"

    npcap_installed = check_npcap_installed()
    db_exists = os.path.exists(settings.DATABASE_PATH)
    total_packets = db.query(PacketRecord).count()
    total_events = db.query(SecurityEvent).count()

    capture_status = capture_service.get_status()

    return {
        "backend_status": "ONLINE",
        "database_status": "CONNECTED" if db_exists else "INITIALIZING",
        "database_file": str(settings.DATABASE_PATH),
        "tshark_installed": tshark_installed,
        "tshark_path": tshark_path or "Not found",
        "tshark_version": tshark_version,
        "npcap_installed": npcap_installed,
        "scapy_available": True,
        "capture_permissions": "Authorized (Npcap ready)" if npcap_installed else "Limited (Npcap required for raw interface capture)",
        "active_capture_session": capture_status["active_session_id"],
        "is_capturing": capture_status["is_capturing"],
        "total_stored_packets": total_packets,
        "total_stored_events": total_events,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
