import csv
import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.capture import PacketRecord
from app.schemas import PacketSchema

router = APIRouter(prefix="/api/packets", tags=["Packets"])

@router.get("", response_model=List[PacketSchema])
def list_packets(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    protocol: Optional[str] = None,
    src_ip: Optional[str] = None,
    dst_ip: Optional[str] = None,
    detection_status: Optional[str] = None,
    mode: Optional[str] = None,
    session_id: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(PacketRecord)

    if protocol:
        query = query.filter(PacketRecord.protocol == protocol.upper())
    if src_ip:
        query = query.filter(PacketRecord.src_ip.contains(src_ip))
    if dst_ip:
        query = query.filter(PacketRecord.dst_ip.contains(dst_ip))
    if detection_status:
        query = query.filter(PacketRecord.detection_status == detection_status.upper())
    if mode:
        query = query.filter(PacketRecord.mode == mode)
    if session_id:
        query = query.filter(PacketRecord.session_id == session_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (PacketRecord.src_ip.ilike(search_pattern)) |
            (PacketRecord.dst_ip.ilike(search_pattern)) |
            (PacketRecord.dns_query.ilike(search_pattern)) |
            (PacketRecord.protocol.ilike(search_pattern))
        )

    packets = query.order_by(PacketRecord.id.desc()).offset(offset).limit(limit).all()
    return packets

@router.get("/{packet_id}", response_model=PacketSchema)
def get_packet_detail(packet_id: int, db: Session = Depends(get_db)):
    packet = db.query(PacketRecord).filter(PacketRecord.id == packet_id).first()
    if not packet:
        raise HTTPException(status_code=404, detail="Packet record not found.")
    return packet

@router.get("/export/data")
def export_packets(
    format: str = Query("csv", pattern="^(csv|json)$"),
    limit: int = Query(500, le=5000),
    db: Session = Depends(get_db)
):
    packets = db.query(PacketRecord).order_by(PacketRecord.id.desc()).limit(limit).all()

    if format == "json":
        data = [PacketSchema.from_orm(p).dict() for p in packets]
        return Response(
            content=json.dumps(data, default=str, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=captured_packets.json"}
        )

    # CSV export
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Timestamp", "Source IP", "Destination IP", "Protocol",
        "Source Port", "Destination Port", "Length", "IP Version", "Detection Status", "Mode"
    ])

    for p in packets:
        writer.writerow([
            p.id, p.timestamp.isoformat(), p.src_ip, p.dst_ip, p.protocol,
            p.src_port or "", p.dst_port or "", p.length, p.ip_version,
            p.detection_status, p.mode
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=captured_packets.csv"}
    )
