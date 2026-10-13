import os
import shutil
import tempfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.capture.interface_manager import discover_network_interfaces
from app.capture.capture_service import capture_service
from app.capture.offline_replay import replay_pcap_file
from app.models.capture import CaptureSession
from app.schemas import NetworkInterfaceInfo, CaptureSessionSchema, StartCaptureRequest

router = APIRouter(prefix="/api/capture", tags=["Packet Capture"])

@router.get("/interfaces", response_model=List[NetworkInterfaceInfo])
def get_interfaces():
    return discover_network_interfaces()

@router.post("/start")
def start_capture(req: StartCaptureRequest):
    result = capture_service.start_capture(
        interface=req.interface_name,
        mode=req.mode,
        bpf_filter=req.bpf_filter or ""
    )
    return result

@router.post("/stop")
def stop_capture():
    return capture_service.stop_capture()

@router.get("/status")
def get_status():
    return capture_service.get_status()

@router.get("/sessions", response_model=List[CaptureSessionSchema])
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(CaptureSession).order_by(CaptureSession.start_time.desc()).limit(50).all()
    return sessions

@router.post("/upload-pcap")
async def upload_pcap(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pcap and .pcapng files are supported.")

    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"upload_{file.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    session_id = f"SES-REPLAY-{os.urandom(4).hex().upper()}"
    new_session = CaptureSession(
        id=session_id,
        mode="OFFLINE_REPLAY",
        interface_name="PCAP_REPLAY",
        status="ACTIVE",
        file_path=temp_path,
        notes=f"Imported offline replay file: {file.filename}"
    )
    db.add(new_session)
    db.commit()

    try:
        packets_replayed = replay_pcap_file(
            file_path=temp_path,
            session_id=session_id,
            packet_callback=capture_service._handle_raw_packet
        )
        new_session.total_packets = packets_replayed
        new_session.status = "STOPPED"
        db.commit()

        return {
            "status": "COMPLETED",
            "session_id": session_id,
            "packets_replayed": packets_replayed,
            "filename": file.filename
        }
    except Exception as e:
        new_session.status = "FAILED"
        new_session.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"PCAP replay failed: {str(e)}")
