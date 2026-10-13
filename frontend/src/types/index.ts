export type OperatingMode = 'LIVE_CAPTURE' | 'OFFLINE_REPLAY' | 'CONTROLLED_LAB' | 'SIMULATED_TEST';
export type TrustState = 'TRUSTED' | 'MONITOR' | 'RESTRICT' | 'ISOLATE';
export type ThreatCategory = 'PHISHING' | 'ARP_SPOOFING' | 'DNS_SPOOFING' | 'PORT_SCAN' | 'ANOMALY' | 'INFORMATIONAL';
export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Packet {
  id: number;
  session_id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_mac: string;
  dst_mac: string;
  protocol: string;
  src_port?: number | null;
  dst_port?: number | null;
  length: number;
  ip_version: string;
  tcp_flags?: string | null;
  dns_query?: string | null;
  dns_reply?: string | null;
  arp_opcode?: string | null;
  arp_sender_mac?: string | null;
  arp_sender_ip?: string | null;
  arp_target_mac?: string | null;
  arp_target_ip?: string | null;
  ttl?: number | null;
  interface: string;
  detection_status: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  related_event_id?: string | null;
  mode: OperatingMode;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  confidence: number;
  src_ip: string;
  dst_ip: string;
  src_mac: string;
  dst_mac: string;
  domain?: string | null;
  protocol: string;
  src_port?: number | null;
  dst_port?: number | null;
  evidence: string;
  detection_reason: string;
  rule_id: string;
  risk_score: number;
  related_packet_id?: number | null;
  session_id?: string | null;
  mode: OperatingMode;
  recommended_response: string;
  investigation_status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export interface DeviceTrust {
  entity_id: string;
  ip_address: string;
  mac_address: string;
  current_trust_score: number;
  behavior_risk_score: number;
  state: TrustState;
  total_incidents: number;
  last_penalty_reason?: string | null;
  last_evaluated: string;
  created_at: string;
  is_active: boolean;
}

export interface TrustHistory {
  id: number;
  entity_id: string;
  timestamp: string;
  previous_score: number;
  new_score: number;
  penalty_applied: number;
  reason: string;
  event_id?: string | null;
}

export interface ZeroTrustDecision {
  id: string;
  timestamp: string;
  entity_id: string;
  trust_score: number;
  behavior_risk: number;
  decision: 'ALLOW' | 'MONITOR' | 'RESTRICT' | 'ISOLATE';
  reason: string;
  evidence: string;
  execution_status: string;
  mode: OperatingMode;
  triggering_event_id?: string | null;
}

export interface RepeatOffender {
  entity_id: string;
  ip_address: string;
  mac_address: string;
  qualifying_incident_count: number;
  escalation_state: 'ACTIVE' | 'ENHANCED_MONITORING' | 'EXTENDED_QUARANTINE' | 'PERMANENT_BLOCK';
  first_incident_time: string;
  last_incident_time: string;
  attack_categories: string;
  notes?: string | null;
}

export interface ResponseAction {
  id: string;
  target_entity: string;
  action_type: 'ALLOW' | 'MONITOR' | 'RESTRICT' | 'ISOLATE' | 'RELEASE';
  triggering_event_id?: string | null;
  policy_decision_id?: string | null;
  requested_operation: string;
  execution_mode: string;
  execution_status: string;
  start_time: string;
  end_time?: string | null;
  result_details: string;
  error_message?: string | null;
  is_verified: boolean;
  rollback_status: string;
}

export interface NetworkFlow {
  id: string;
  session_id: string;
  src_ip: string;
  dst_ip: string;
  src_port?: number | null;
  dst_port?: number | null;
  protocol: string;
  packet_count: number;
  byte_count: number;
  start_time: string;
  last_seen: string;
  duration_seconds: number;
  state: string;
  linked_event_id?: string | null;
  mode: string;
}

export interface HoneypotInstance {
  id: string;
  name: string;
  service_type: string;
  port: number;
  ip_address: string;
  status: string;
  interaction_count: number;
  mode: string;
  deployed_at: string;
  last_interaction?: string | null;
  health_status: string;
}

export interface HoneypotEvent {
  id: string;
  honeypot_id: string;
  timestamp: string;
  src_ip: string;
  src_port?: number | null;
  interaction_type: string;
  payload_snippet?: string | null;
  threat_level: string;
  linked_event_id?: string | null;
  mode: string;
}

export interface SelfHealingPlan {
  id: string;
  entity_id: string;
  status: string;
  reason: string;
  prerequisites_satisfied: boolean;
  prerequisites_breakdown: string;
  created_at: string;
  executed_at?: string | null;
  completed_at?: string | null;
  verified: boolean;
  verification_details?: string | null;
  rollback_performed: boolean;
  recovery_time_seconds?: number | null;
}

export interface NetworkInterfaceInfo {
  id: string;
  name: string;
  description: string;
  ipv4_addresses: string[];
  ipv6_addresses: string[];
  mac_address: string;
  interface_type: string;
  is_up: boolean;
  is_loopback: boolean;
  is_eligible: boolean;
  permission_status: string;
}

export interface CaptureSession {
  id: string;
  start_time: string;
  end_time?: string | null;
  mode: OperatingMode;
  interface_name: string;
  status: string;
  total_packets: number;
  file_path?: string | null;
  error_message?: string | null;
  notes?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  category: string;
  target: string;
  details: string;
  status: string;
}

export interface ScenarioResult {
  id: string;
  scenario_name: string;
  timestamp: string;
  mode: string;
  expected_outcome: string;
  actual_outcome: string;
  status: string;
  duration_ms: number;
  details?: string | null;
}

export interface Investigation {
  id: string;
  title: string;
  event_id: string;
  status: string;
  priority: string;
  analyst: string;
  notes: string;
  evidence_links: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticsData {
  backend_status: string;
  database_status: string;
  database_file: string;
  tshark_installed: boolean;
  tshark_path: string;
  tshark_version: string;
  npcap_installed: boolean;
  scapy_available: boolean;
  capture_permissions: string;
  active_capture_session?: string | null;
  is_capturing: boolean;
  total_stored_packets: number;
  total_stored_events: number;
  timestamp: string;
}
