import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.flow import NetworkFlow

def process_packet_into_flow(
    db: Session,
    packet: Dict[str, Any]
) -> NetworkFlow:
    """
    Aggregates packet metadata into stateful bidirectional network flows.
    """
    src_ip = packet.get("src_ip", "N/A")
    dst_ip = packet.get("dst_ip", "N/A")
    src_port = packet.get("src_port")
    dst_port = packet.get("dst_port")
    protocol = str(packet.get("protocol", "OTHER"))
    session_id = packet.get("session_id", "GLOBAL")
    mode = packet.get("mode", "LIVE_CAPTURE")
    pkt_len = int(packet.get("length", 0))
    event_id = packet.get("related_event_id")

    now = datetime.datetime.utcnow()

    # Search for matching active flow (either forward or reverse direction)
    flow = db.query(NetworkFlow).filter(
        NetworkFlow.session_id == session_id,
        NetworkFlow.protocol == protocol,
        NetworkFlow.state == "ACTIVE",
        (
            (NetworkFlow.src_ip == src_ip) & (NetworkFlow.dst_ip == dst_ip) &
            (NetworkFlow.src_port == src_port) & (NetworkFlow.dst_port == dst_port)
        ) | (
            (NetworkFlow.src_ip == dst_ip) & (NetworkFlow.dst_ip == src_ip) &
            (NetworkFlow.src_port == dst_port) & (NetworkFlow.dst_port == src_port)
        )
    ).first()

    if flow:
        flow.packet_count += 1
        flow.byte_count += pkt_len
        flow.last_seen = now
        flow.duration_seconds = max(0.01, (now - flow.start_time).total_seconds())
        if event_id and not flow.linked_event_id:
            flow.linked_event_id = event_id
    else:
        flow = NetworkFlow(
            id=f"FLW-{uuid.uuid4().hex[:12].upper()}",
            session_id=session_id,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=src_port,
            dst_port=dst_port,
            protocol=protocol,
            packet_count=1,
            byte_count=pkt_len,
            start_time=now,
            last_seen=now,
            duration_seconds=0.0,
            state="ACTIVE",
            linked_event_id=event_id,
            mode=mode
        )
        db.add(flow)

    db.commit()
    return flow
