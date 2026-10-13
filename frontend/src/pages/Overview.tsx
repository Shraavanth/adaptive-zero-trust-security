import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Lock,
  HeartPulse,
  Radar,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { SeverityBadge, TrustBadge, ModeBadge } from '../components/Badge';
import { SecurityEvent, DeviceTrust, ZeroTrustDecision } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export const Overview: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [reports, setReports] = useState<any>(null);
  const [recentThreats, setRecentThreats] = useState<SecurityEvent[]>([]);
  const [deviceTrusts, setDeviceTrusts] = useState<DeviceTrust[]>([]);
  const [decisions, setDecisions] = useState<ZeroTrustDecision[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [rep, threats, trusts, decs] = await Promise.all([
        api.getReportsSummary(),
        api.getThreats({ limit: 6 }),
        api.getDeviceTrust(),
        api.getDecisions(6)
      ]);
      setReports(rep);
      setRecentThreats(threats);
      setDeviceTrusts(trusts);
      setDecisions(decs);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics = reports?.metrics || {
    total_packets: 0,
    total_threats: 0,
    total_isolated_hosts: 0,
    monitored_devices: 0
  };

  const severityChartData = Object.entries(reports?.severity_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const SEV_COLORS: Record<string, string> = {
    CRITICAL: '#e11d48',
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6',
    INFO: '#64748b'
  };

  const trustDistData = Object.entries(reports?.trust_state_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const TRUST_COLORS: Record<string, string> = {
    TRUSTED: '#10b981',
    MONITOR: '#f59e0b',
    RESTRICT: '#f97316',
    ISOLATE: '#ef4444'
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-soc-text">Security Operations Center Overview</h2>
          <p className="text-xs text-soc-muted">Adaptive Zero Trust Threat Telemetry & Dynamic Policy Posture</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-card hover:bg-soc-cardHover border border-soc-border text-xs font-mono text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Packets Analyzed"
          value={metrics.total_packets.toLocaleString()}
          subtitle="Real-time DPI ingestion buffer"
          icon={<Activity className="w-4 h-4" />}
          statusColor="blue"
        />
        <MetricCard
          title="Security Incidents"
          value={metrics.total_threats}
          subtitle="Phishing, ARP & DNS Spoofs"
          icon={<AlertTriangle className="w-4 h-4" />}
          statusColor={metrics.total_threats > 0 ? "rose" : "slate"}
        />
        <MetricCard
          title="Active Quarantines"
          value={metrics.total_isolated_hosts}
          subtitle="Microsegmented host enclaves"
          icon={<Lock className="w-4 h-4" />}
          statusColor={metrics.total_isolated_hosts > 0 ? "rose" : "slate"}
        />
        <MetricCard
          title="Monitored Endpoints"
          value={metrics.monitored_devices}
          subtitle="Dynamic trust state baselines"
          icon={<ShieldAlert className="w-4 h-4" />}
          statusColor="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-soc-text uppercase tracking-wider font-mono">Incident Severity Distribution</h3>
            <span className="text-[11px] font-mono text-soc-dim">By Alert Severity</span>
          </div>
          <div className="h-48">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityChartData.map((entry, idx) => (
                      <Cell key={`sev-${idx}`} fill={SEV_COLORS[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-soc-dim font-mono">
                No security incident telemetry recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Device Trust Breakdown */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-soc-text uppercase tracking-wider font-mono">Device Trust State Posture</h3>
            <span className="text-[11px] font-mono text-soc-dim">Zero Trust Bands</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            {trustDistData.length > 0 ? (
              <div className="flex items-center justify-around w-full">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={trustDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                      {trustDistData.map((entry, idx) => (
                        <Cell key={`trust-${idx}`} fill={TRUST_COLORS[entry.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-xs font-mono">
                  {trustDistData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TRUST_COLORS[d.name] || '#64748b' }} />
                      <span className="text-soc-muted">{d.name}:</span>
                      <span className="font-bold text-soc-text">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-soc-dim font-mono">No host baselines established yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Threats & Zero Trust Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threats */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-soc-text uppercase tracking-wider font-mono">Recent Threats</h3>
            <button
              onClick={() => onNavigate('threats')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-soc-border/50">
            {recentThreats.length > 0 ? (
              recentThreats.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={t.severity} />
                      <span className="text-soc-text font-bold truncate">{t.category}</span>
                    </div>
                    <p className="text-[11px] text-soc-dim truncate">Target: {t.src_ip} | {t.rule_id}</p>
                  </div>
                  <span className="text-[11px] text-soc-dim shrink-0">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-soc-dim font-mono text-center">No threats active.</p>
            )}
          </div>
        </div>

        {/* Latest Zero Trust Decisions */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-soc-text uppercase tracking-wider font-mono">Latest Zero Trust Decisions</h3>
            <button
              onClick={() => onNavigate('zt-decisions')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
            >
              View Policy <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-soc-border/50">
            {decisions.length > 0 ? (
              decisions.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <TrustBadge state={d.decision} />
                      <span className="text-soc-text truncate">{d.entity_id}</span>
                    </div>
                    <p className="text-[11px] text-soc-dim truncate">{d.reason}</p>
                  </div>
                  <span className="text-[11px] text-soc-dim shrink-0">
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-soc-dim font-mono text-center">No policy events logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
