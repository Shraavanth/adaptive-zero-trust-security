from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Packets & Capture -----------------
class PacketSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_mac: str
    dst_mac: str
    protocol: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    length: int
    ip_version: str
    tcp_flags: Optional[str] = None
    dns_query: Optional[str] = None
    dns_reply: Optional[str] = None
    arp_opcode: Optional[str] = None
    arp_sender_mac: Optional[str] = None
    arp_sender_ip: Optional[str] = None
    arp_target_mac: Optional[str] = None
    arp_target_ip: Optional[str] = None
    ttl: Optional[int] = None
    interface: str
    detection_status: str
    related_event_id: Optional[str] = None
    mode: str

class CaptureSessionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    mode: str
    interface_name: str
    status: str
    total_packets: int
    file_path: Optional[str] = None
    error_message: Optional[str] = None
    notes: Optional[str] = None

class StartCaptureRequest(BaseModel):
    interface_name: str = Field(min_length=1, max_length=512)
    mode: Literal["LIVE_CAPTURE", "SIMULATED_TEST", "CONTROLLED_LAB"] = "LIVE_CAPTURE"
    packet_limit: Optional[int] = Field(default=1000, ge=1, le=100000)
    bpf_filter: Optional[str] = Field(default="", max_length=2048)

class NetworkInterfaceInfo(BaseModel):
    id: str
    name: str
    description: str
    ipv4_addresses: List[str] = []
    ipv6_addresses: List[str] = []
    mac_address: str = "N/A"
    interface_type: str = "Unknown"
    is_up: bool = True
    is_loopback: bool = False
    is_eligible: bool = True
    permission_status: str = "Capture permission not verified"

# ----------------- Network Flows -----------------
class NetworkFlowSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: str
    packet_count: int
    byte_count: int
    start_time: datetime
    last_seen: datetime
    duration_seconds: float
    state: str
    linked_event_id: Optional[str] = None
    mode: str

# ----------------- Security Events & Investigations -----------------
class SecurityEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    category: str
    severity: str
    confidence: float
    src_ip: str
    dst_ip: str
    src_mac: str
    dst_mac: str
    domain: Optional[str] = None
    protocol: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    evidence: str
    detection_reason: str
    rule_id: str
    risk_score: int
    related_packet_id: Optional[int] = None
    session_id: Optional[str] = None
    mode: str
    recommended_response: str
    investigation_status: str

class InvestigationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    event_id: str
    status: str
    priority: str
    analyst: str
    notes: str
    evidence_links: str
    created_at: datetime
    updated_at: datetime

class CreateInvestigationRequest(BaseModel):
    title: str
    event_id: str
    priority: str = "HIGH"
    analyst: str = "SecOps Analyst"
    notes: Optional[str] = ""

# ----------------- Trust & Risk -----------------
class DeviceTrustSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_id: str
    ip_address: str
    mac_address: str
    current_trust_score: int
    behavior_risk_score: int
    state: str
    total_incidents: int
    last_penalty_reason: Optional[str] = None
    last_evaluated: datetime
    created_at: datetime
    is_active: bool

class TrustHistorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_id: str
    timestamp: datetime
    previous_score: int
    new_score: int
    penalty_applied: int
    reason: str
    event_id: Optional[str] = None

# ----------------- Zero Trust Decisions & Repeat Offenders -----------------
class ZeroTrustDecisionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    entity_id: str
    trust_score: int
    behavior_risk: int
    decision: str
    reason: str
    evidence: str
    execution_status: str
    mode: str
    triggering_event_id: Optional[str] = None

class RepeatOffenderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_id: str
    ip_address: str
    mac_address: str
    qualifying_incident_count: int
    escalation_state: str
    first_incident_time: datetime
    last_incident_time: datetime
    attack_categories: str
    notes: Optional[str] = None

# ----------------- Response & Isolation -----------------
class ResponseActionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_entity: str
    action_type: str
    triggering_event_id: Optional[str] = None
    policy_decision_id: Optional[str] = None
    requested_operation: str
    execution_mode: str
    execution_status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    result_details: str
    error_message: Optional[str] = None
    is_verified: bool
    rollback_status: str

class IncidentTimelineEntrySchema(BaseModel):
    timestamp: datetime
    record_type: Literal["DETECTION", "PACKET", "TRUST", "POLICY", "RESPONSE"]
    title: str
    detail: str
    status: Optional[str] = None

class IncidentEvidenceSchema(BaseModel):
    event: SecurityEventSchema
    packet: Optional[PacketSchema] = None
    trust_history: List[TrustHistorySchema]
    policy_decisions: List[ZeroTrustDecisionSchema]
    response_actions: List[ResponseActionSchema]
    timeline: List[IncidentTimelineEntrySchema]

class ExecuteActionRequest(BaseModel):
    target_entity: str
    action_type: str  # ALLOW, MONITOR, RESTRICT, ISOLATE, RELEASE
    reason: str
    mode: Optional[str] = "SIMULATED"

class PreviewActionRequest(BaseModel):
    target_entity: str = Field(min_length=1, max_length=64)
    action_type: Literal["ALLOW", "MONITOR", "RESTRICT", "ISOLATE", "RELEASE"]
    reason: str = Field(min_length=1, max_length=1000)

class ResponsePreviewSchema(BaseModel):
    target_entity: str
    action_type: str
    execution_mode: Literal["SIMULATED"]
    requested_operation: str
    reason: str
    would_mutate_state: Literal[False]
    affected_local_records: List[str]
    rollback_action: Optional[str] = None
    rollback_limitations: str

# ----------------- Honeypot -----------------
class HoneypotInstanceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    service_type: str
    port: int
    ip_address: str
    status: str
    interaction_count: int
    mode: str
    deployed_at: datetime
    last_interaction: Optional[datetime] = None
    health_status: str

class HoneypotEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    honeypot_id: str
    timestamp: datetime
    src_ip: str
    src_port: Optional[int] = None
    interaction_type: str
    payload_snippet: Optional[str] = None
    threat_level: str
    linked_event_id: Optional[str] = None
    mode: str

# ----------------- Self-Healing -----------------
class SelfHealingPlanSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_id: str
    status: str
    reason: str
    prerequisites_satisfied: bool
    prerequisites_breakdown: str
    created_at: datetime
    executed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified: bool
    verification_details: Optional[str] = None
    rollback_performed: bool
    recovery_time_seconds: Optional[float] = None

# ----------------- Audit & Diagnostics & Scenarios -----------------
class AuditLogSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    action: str
    actor: str
    category: str
    target: str
    details: str
    status: str

class ScenarioResultSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario_name: str
    timestamp: datetime
    mode: str
    expected_outcome: str
    actual_outcome: str
    status: str
    duration_ms: float
    details: Optional[str] = None

class DiagnosticsStatus(BaseModel):
    backend_status: str
    database_status: str
    database_file: str
    tshark_installed: bool
    tshark_path: str
    tshark_version: str
    npcap_installed: bool
    scapy_available: bool
    capture_permissions: str
    active_capture_session: Optional[str] = None
    total_stored_packets: int
    total_stored_events: int
    timestamp: datetime
