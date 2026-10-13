from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.trust import DeviceTrust
from app.models.honeypot import HoneypotInstance
from app.models.flow import NetworkFlow

router = APIRouter(prefix="/api/topology", tags=["Network Topology"])

@router.get("")
def get_topology(db: Session = Depends(get_db)):
    # Discover nodes from DeviceTrust table
    devices = db.query(DeviceTrust).all()
    honeypots = db.query(HoneypotInstance).all()
    flows = db.query(NetworkFlow).limit(50).all()

    nodes = [
        {
            "id": "GATEWAY-01",
            "label": "Core Gateway (192.168.1.1)",
            "type": "GATEWAY",
            "ip": "192.168.1.1",
            "status": "TRUSTED",
            "category": "CONFIGURED",
            "trust_score": 100
        }
    ]

    for d in devices:
        nodes.append({
            "id": d.entity_id,
            "label": f"Host {d.ip_address}",
            "type": "ENDPOINT",
            "ip": d.ip_address,
            "mac": d.mac_address,
            "status": d.state,
            "category": "DISCOVERED",
            "trust_score": d.current_trust_score,
            "risk_score": d.behavior_risk_score
        })

    for hp in honeypots:
        nodes.append({
            "id": hp.id,
            "label": f"Honeypot: {hp.name}",
            "type": "HONEYPOT",
            "ip": f"{hp.ip_address}:{hp.port}",
            "status": "HONEYPOT",
            "category": "SIMULATED",
            "trust_score": 0
        })

    # Build communication links from network flows
    links = []
    seen_links = set()
    for f in flows:
        if f.src_ip and f.dst_ip and f.src_ip != "N/A" and f.dst_ip != "N/A":
            link_key = tuple(sorted([f.src_ip, f.dst_ip]))
            if link_key not in seen_links:
                seen_links.add(link_key)
                links.append({
                    "source": f.src_ip,
                    "target": f.dst_ip,
                    "protocol": f.protocol,
                    "packet_count": f.packet_count,
                    "byte_count": f.byte_count,
                    "is_malicious": f.linked_event_id is not None
                })

    return {
        "nodes": nodes,
        "links": links
    }
