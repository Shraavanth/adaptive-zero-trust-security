from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.capture import PacketRecord
from app.models.detection import SecurityEvent
from app.models.trust import DeviceTrust
from app.models.response import ResponseAction, IsolationRecord
from app.models.policy import RepeatOffender

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    total_packets = db.query(PacketRecord).count()
    total_threats = db.query(SecurityEvent).count()
    total_isolated = db.query(IsolationRecord).filter(IsolationRecord.status == "ISOLATED").count()
    total_devices = db.query(DeviceTrust).count()

    # Severity breakdown
    sev_counts = db.query(SecurityEvent.severity, func.count(SecurityEvent.id)).group_by(SecurityEvent.severity).all()
    severity_dist = {sev: cnt for sev, cnt in sev_counts}

    # Category breakdown
    cat_counts = db.query(SecurityEvent.category, func.count(SecurityEvent.id)).group_by(SecurityEvent.category).all()
    category_dist = {cat: cnt for cat, cnt in cat_counts}

    # Protocol breakdown
    proto_counts = db.query(PacketRecord.protocol, func.count(PacketRecord.id)).group_by(PacketRecord.protocol).limit(10).all()
    protocol_dist = {proto: cnt for proto, cnt in proto_counts}

    # Device trust distribution
    state_counts = db.query(DeviceTrust.state, func.count(DeviceTrust.entity_id)).group_by(DeviceTrust.state).all()
    trust_dist = {st: cnt for st, cnt in state_counts}

    # Top repeat offenders
    top_offenders = db.query(RepeatOffender).order_by(RepeatOffender.qualifying_incident_count.desc()).limit(5).all()

    return {
        "metrics": {
            "total_packets": total_packets,
            "total_threats": total_threats,
            "total_isolated_hosts": total_isolated,
            "monitored_devices": total_devices
        },
        "severity_distribution": severity_dist,
        "category_distribution": category_dist,
        "protocol_distribution": protocol_dist,
        "trust_state_distribution": trust_dist,
        "top_offenders": [
            {
                "entity_id": o.entity_id,
                "ip": o.ip_address,
                "incident_count": o.qualifying_incident_count,
                "escalation_state": o.escalation_state,
                "categories": o.attack_categories
            }
            for o in top_offenders
        ]
    }
