from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.flow import NetworkFlow
from app.schemas import NetworkFlowSchema

router = APIRouter(prefix="/api/flows", tags=["Network Flows"])

@router.get("", response_model=List[NetworkFlowSchema])
def list_flows(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    protocol: Optional[str] = None,
    src_ip: Optional[str] = None,
    dst_ip: Optional[str] = None
):
    query = db.query(NetworkFlow)
    if protocol:
        query = query.filter(NetworkFlow.protocol == protocol.upper())
    if src_ip:
        query = query.filter(NetworkFlow.src_ip.contains(src_ip))
    if dst_ip:
        query = query.filter(NetworkFlow.dst_ip.contains(dst_ip))

    flows = query.order_by(NetworkFlow.last_seen.desc()).limit(limit).all()
    return flows
