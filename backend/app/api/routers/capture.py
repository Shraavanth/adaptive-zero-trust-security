import os
import tempfile
import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.capture.interface_manager import discover_network_interfaces
from app.capture.capture_service import capture_service
from app.capture.offline_replay import replay_pcap_file
from app.models.capture import CaptureSession
from app.schemas import NetworkInterfaceInfo, CaptureSessionSchema, StartCaptureRequest

router = APIRouter(prefix="/api/capture", tags=["Packet Capture"])
MAX_PCAP_UPLOAD_BYTES = 50 * 1024 * 1024
logger = logging.getLogger("capture_api")

@router.get("/interfaces", response_model=List[NetworkInterfaceInfo])
def get_interfaces():
    return discover_network_interfaces()

@router.post("/start")
def start_capture(req: StartCaptureRequest):
    try:
        result = capture_service.start_capture(
            interface=req.interface_name,
            mode=req.mode,
            bpf_filter=req.bpf_filter or ""
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if result["status"] == "FAILED":
        raise HTTPException(status_code=503, detail=result["error"])
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
    filename = os.path.basename(file.filename or "")
    extension = os.path.splitext(filename)[1].lower()
    if extension not in (".pcap", ".pcapng", ".cap"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pcap, .pcapng, and .cap files are supported.")

    temp_path = None
    new_session = None
    try:
        with tempfile.NamedTemporaryFile(prefix="azt-replay-", suffix=extension, delete=False) as temp_file:
            temp_path = temp_file.name
            size = 0
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_PCAP_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"PCAP uploads are limited to {MAX_PCAP_UPLOAD_BYTES // (1024 * 1024)} MB."
                    )
                temp_file.write(chunk)

        session_id = f"SES-REPLAY-{os.urandom(4).hex().upper()}"
        new_session = CaptureSession(
            id=session_id,
            mode="OFFLINE_REPLAY",
            interface_name="PCAP_REPLAY",
            status="ACTIVE",
            notes=f"Imported offline replay file: {filename}"
        )
        db.add(new_session)
        db.commit()

        packets_replayed = replay_pcap_file(
            file_path=temp_path,
            session_id=session_id,
            packet_callback=lambda packet: capture_service.process_packet(
                packet,
                session_id=session_id,
                interface="PCAP_REPLAY",
                mode="OFFLINE_REPLAY"
            )
        )
        new_session.total_packets = packets_replayed
        new_session.status = "STOPPED"
        new_session.end_time = datetime.datetime.utcnow()
        db.commit()

        return {
            "status": "COMPLETED",
            "session_id": session_id,
            "packets_replayed": packets_replayed,
            "filename": filename
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Offline PCAP replay failed.")
        if new_session is not None:
            failed_session = db.query(CaptureSession).filter(CaptureSession.id == new_session.id).first()
            if failed_session:
                failed_session.status = "FAILED"
                failed_session.end_time = datetime.datetime.utcnow()
                failed_session.error_message = "Offline PCAP replay failed. See server logs for details."
                db.commit()
        raise HTTPException(
            status_code=500,
            detail="PCAP replay failed. Check server logs for details."
        ) from exc
    finally:
        await file.close()
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                logger.exception("Unable to remove temporary PCAP replay file.")
