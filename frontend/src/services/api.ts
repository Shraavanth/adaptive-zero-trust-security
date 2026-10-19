import { useEffect, useState } from 'react';
import {
  Packet,
  SecurityEvent,
  DeviceTrust,
  TrustHistory,
  ZeroTrustDecision,
  RepeatOffender,
  ResponseAction,
  NetworkFlow,
  HoneypotInstance,
  HoneypotEvent,
  SelfHealingPlan,
  NetworkInterfaceInfo,
  CaptureSession,
  AuditLog,
  ScenarioResult,
  Investigation,
  IncidentEvidence,
  DiagnosticsData,
  OperatingMode,
  ResponsePreview
} from '../types';

const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (_) {}
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

export const api = {
  // Diagnostics & Health
  getHealth: () => fetchJson<{ status: string; app_name: string; version: string }>(`${API_BASE}/health`),
  getDiagnostics: () => fetchJson<DiagnosticsData>(`${API_BASE}/diagnostics`),

  // Capture
  getInterfaces: () => fetchJson<NetworkInterfaceInfo[]>(`${API_BASE}/capture/interfaces`),
  startCapture: (interface_name: string, mode: OperatingMode = 'LIVE_CAPTURE', bpf_filter = '') =>
    fetchJson<{ status: string; session_id: string }>(`${API_BASE}/capture/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interface_name, mode, bpf_filter })
    }),
  stopCapture: () => fetchJson<{ status: string; session_id?: string }>(`${API_BASE}/capture/stop`, { method: 'POST' }),
  getCaptureStatus: () => fetchJson<{ is_capturing: boolean; active_session_id?: string; current_interface?: string; mode: string; stats: any; engine_type: string }>(`${API_BASE}/capture/status`),
  getCaptureSessions: () => fetchJson<CaptureSession[]>(`${API_BASE}/capture/sessions`),
  uploadPcap: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson<{ status: string; session_id: string; packets_replayed: number }>(`${API_BASE}/capture/upload-pcap`, {
      method: 'POST',
      body: formData
    });
  },

  // Packets
  getPackets: (params?: { limit?: number; offset?: number; protocol?: string; src_ip?: string; dst_ip?: string; detection_status?: string; mode?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.protocol) query.set('protocol', params.protocol);
    if (params?.src_ip) query.set('src_ip', params.src_ip);
    if (params?.dst_ip) query.set('dst_ip', params.dst_ip);
    if (params?.detection_status) query.set('detection_status', params.detection_status);
    if (params?.mode) query.set('mode', params.mode);
    if (params?.search) query.set('search', params.search);
    return fetchJson<Packet[]>(`${API_BASE}/packets?${query.toString()}`);
  },
  getPacketDetail: (id: number) => fetchJson<Packet>(`${API_BASE}/packets/${id}`),

  // Flows
  getFlows: (limit = 100) => fetchJson<NetworkFlow[]>(`${API_BASE}/flows?limit=${limit}`),

  // Threats & Investigations
  getThreats: (params?: { limit?: number; category?: string; severity?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.status) query.set('status', params.status);
    return fetchJson<SecurityEvent[]>(`${API_BASE}/threats?${query.toString()}`);
  },
  getThreatDetail: (id: string) => fetchJson<SecurityEvent>(`${API_BASE}/threats/${id}`),
  getThreatEvidence: (id: string) => fetchJson<IncidentEvidence>(`${API_BASE}/threats/${id}/evidence`),
  updateThreatStatus: (id: string, status: string) =>
    fetchJson(`${API_BASE}/threats/${id}/status?status=${status}`, { method: 'PATCH' }),

  getInvestigations: () => fetchJson<Investigation[]>(`${API_BASE}/investigations`),
  createInvestigation: (title: string, event_id: string, priority = 'HIGH', notes = '') =>
    fetchJson<Investigation>(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, event_id, priority, notes })
    }),
  updateInvestigation: (id: string, status?: string, notes?: string) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (notes) query.set('notes', notes);
    return fetchJson(`${API_BASE}/investigations/${id}?${query.toString()}`, { method: 'PATCH' });
  },

  // Trust & Policies
  getDeviceTrust: () => fetchJson<DeviceTrust[]>(`${API_BASE}/trust`),
  getTrustHistory: (entity_id: string) => fetchJson<TrustHistory[]>(`${API_BASE}/trust/${encodeURIComponent(entity_id)}/history`),

  getDecisions: (limit = 100) => fetchJson<ZeroTrustDecision[]>(`${API_BASE}/policies/decisions?limit=${limit}`),
  getRepeatOffenders: () => fetchJson<RepeatOffender[]>(`${API_BASE}/policies/repeat-offenders`),

  // Response & Isolation
  getResponseActions: () => fetchJson<ResponseAction[]>(`${API_BASE}/response/actions`),
  getIsolations: () => fetchJson<any[]>(`${API_BASE}/response/isolations`),
  previewResponse: (target_entity: string, action_type: ResponseAction['action_type'], reason: string) =>
    fetchJson<ResponsePreview>(`${API_BASE}/response/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_entity, action_type, reason })
    }),
  executeResponse: (target_entity: string, action_type: string, reason: string, mode = 'SIMULATED') =>
    fetchJson<ResponseAction>(`${API_BASE}/response/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_entity, action_type, reason, mode })
    }),

  // Honeypots
  getHoneypots: () => fetchJson<HoneypotInstance[]>(`${API_BASE}/honeypots`),
  getHoneypotEvents: () => fetchJson<HoneypotEvent[]>(`${API_BASE}/honeypots/events`),

  // Self-Healing
  getHealingPlans: () => fetchJson<SelfHealingPlan[]>(`${API_BASE}/self-healing/plans`),
  evaluateHealing: (entity_id: string) =>
    fetchJson<{ entity_id: string; prerequisites_satisfied: boolean; breakdown: any }>(`${API_BASE}/self-healing/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id })
    }),
  executeHealing: (entity_id: string, auto_execute = true) =>
    fetchJson<SelfHealingPlan>(`${API_BASE}/self-healing/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id, auto_execute })
    }),

  // Audit
  getAuditLogs: (limit = 100) => fetchJson<AuditLog[]>(`${API_BASE}/audit?limit=${limit}`),

  // Topology
  getTopology: () => fetchJson<{ nodes: any[]; links: any[] }>(`${API_BASE}/topology`),

  // Scenarios & Testing
  runScenario: (scenario_id: string, target_ip = '192.168.1.188') =>
    fetchJson<ScenarioResult>(`${API_BASE}/testing/run-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id, target_ip })
    }),
  getScenarioResults: () => fetchJson<ScenarioResult[]>(`${API_BASE}/testing/results`),

  // Reports
  getReportsSummary: () => fetchJson<any>(`${API_BASE}/reports/summary`),

  // Settings
  getSettings: () => fetchJson<Record<string, string>>(`${API_BASE}/settings`),
  updateSettings: (updates: Record<string, string>) =>
    fetchJson<{ status: string; keys_updated: string[] }>(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
};

// React hook for live packet streaming via Server-Sent Events (SSE)
export function useLivePacketStream(onNewPacket?: (pkt: Packet) => void) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/events/stream`);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'PACKET' && payload.data && onNewPacket) {
          onNewPacket(payload.data);
        }
      } catch (err) {
        // Heartbeat or ping event
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
    };
  }, [onNewPacket]);

  return { isConnected };
}
