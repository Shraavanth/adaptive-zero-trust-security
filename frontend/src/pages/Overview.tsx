import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Fingerprint, Lock, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Sparkline } from '../components/Sparkline';
import { SeverityBadge, TrustBadge } from '../components/Badge';
import { ThreatRadar, RadarHost } from '../components/viz/ThreatRadar';
import { TrustGauge } from '../components/viz/TrustGauge';
import { useTelemetry } from '../lib/telemetry';
import { SecurityEvent, DeviceTrust, ZeroTrustDecision } from '../types';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
const SEV_TONE: Record<string, string> = {
  CRITICAL: 'bg-rose-400',
  HIGH: 'bg-rose-300/80',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-ice-400',
  INFO: 'bg-ice-600',
};
const SEV_SHORT: Record<string, string> = { CRITICAL: 'CRIT', HIGH: 'HIGH', MEDIUM: 'MED', LOW: 'LOW', INFO: 'INFO' };
const ACRONYMS = new Set(['DNS', 'ARP', 'DGA', 'MITM', 'TCP', 'UDP', 'ICMP']);
const humanize = (cat: string) =>
  cat
    .split('_')
    .map((w, i) => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : i === 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');

const STATES = ['TRUSTED', 'MONITOR', 'RESTRICT', 'ISOLATE'] as const;
const STATE_TONE: Record<string, string> = {
  TRUSTED: 'bg-signal-400',
  MONITOR: 'bg-amber-400',
  RESTRICT: 'bg-orange-400',
  ISOLATE: 'bg-rose-400',
};
const PROTO_TONE = ['bg-signal-400', 'bg-ice-300', 'bg-amber-400', 'bg-ice-500', 'bg-orange-400', 'bg-ice-700'];

const relTime = (ts: string) => {
  const t = new Date(ts.endsWith('Z') || ts.includes('+') ? ts : `${ts}Z`).getTime();
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
};

const Tile: React.FC<{ i: number; className?: string; children: React.ReactNode }> = ({ i, className = '', children }) => (
  <section className={`panel tile-in ${className}`} style={{ ['--i' as string]: i }}>
    {children}
  </section>
);

const TileHead: React.FC<{ label: string; meta?: React.ReactNode }> = ({ label, meta }) => (
  <div className="flex items-center justify-between gap-3">
    <h3 className="label-caps">{label}</h3>
    {meta && <div className="font-mono text-[10.5px] text-soc-dim">{meta}</div>}
  </div>
);

export const Overview: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { packets, rateHistory, isCapturing } = useTelemetry();
  const [reports, setReports] = useState<any>(null);
  const [recentThreats, setRecentThreats] = useState<SecurityEvent[]>([]);
  const [deviceTrusts, setDeviceTrusts] = useState<DeviceTrust[]>([]);
  const [decisions, setDecisions] = useState<ZeroTrustDecision[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [rep, threats, trusts, decs] = await Promise.all([
        api.getReportsSummary(),
        api.getThreats({ limit: 6 }),
        api.getDeviceTrust(),
        api.getDecisions(6),
      ]);
      setReports(rep);
      setRecentThreats(threats);
      setDeviceTrusts(trusts);
      setDecisions(decs);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics = reports?.metrics || { total_packets: 0, total_threats: 0, total_isolated_hosts: 0, monitored_devices: 0 };

  const hosts: RadarHost[] = useMemo(
    () =>
      deviceTrusts.map((d) => ({
        id: d.entity_id,
        ip: d.ip_address || d.entity_id,
        state: String(d.state).toUpperCase(),
        trust: d.current_trust_score,
        risk: d.behavior_risk_score,
      })),
    [deviceTrusts]
  );

  const trustIndex = deviceTrusts.length
    ? deviceTrusts.reduce((sum, d) => sum + d.current_trust_score, 0) / deviceTrusts.length
    : 100;

  const sevDist: Record<string, number> = reports?.severity_distribution || {};
  const sevMax = Math.max(1, ...SEVERITIES.map((s) => sevDist[s] || 0));
  const stateDist: Record<string, number> = reports?.trust_state_distribution || {};
  const stateTotal = Math.max(1, STATES.reduce((a, s) => a + (stateDist[s] || 0), 0));
  const protoEntries = Object.entries((reports?.protocol_distribution || {}) as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const protoTotal = Math.max(1, protoEntries.reduce((a, [, v]) => a + v, 0));

  const kpis = [
    { label: 'Packets analyzed', value: metrics.total_packets, icon: Activity, spark: true, page: 'live-monitor' },
    { label: 'Security incidents', value: metrics.total_threats, icon: AlertTriangle, hot: metrics.total_threats > 0, page: 'threats' },
    { label: 'Active quarantines', value: metrics.total_isolated_hosts, icon: Lock, hot: metrics.total_isolated_hosts > 0, page: 'isolation-response' },
    { label: 'Monitored endpoints', value: metrics.monitored_devices, icon: Fingerprint, page: 'device-trust' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-head">
        <div>
          <h2>Network posture, live</h2>
          <p>Every monitored endpoint on one scope, scored by the trust engine and refreshed every five seconds.</p>
        </div>
        <button onClick={loadData} className="btn-ghost">
          <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${refreshing ? 'spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Radar — the centrepiece */}
        <Tile i={0} className="overflow-hidden p-0 lg:col-span-8 lg:row-span-2">
          <div className="relative h-[460px] sm:h-[560px] lg:h-full lg:min-h-[620px]">
            <ThreatRadar hosts={hosts} packets={packets} live={isCapturing} className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
              <div>
                <p className="label-caps flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${isCapturing ? 'live-ping bg-signal-400 text-signal-400' : 'bg-ice-600'}`} />
                  Threat radar
                </p>
                <p className="mt-3 max-w-[15ch] text-[26px] font-medium leading-[1.05] tracking-[-0.025em] text-soc-text">
                  Closer to the core <span className="font-display font-normal italic text-signal-300">means trusted.</span>
                </p>
              </div>
              <p className="font-mono text-[10.5px] text-soc-dim">{isCapturing ? 'SWEEP 4.2S · LIVE' : 'SWEEP 9.0S · IDLE'}</p>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-5 gap-y-2 p-6 font-mono text-[10.5px] text-soc-dim">
              {STATES.map((s) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATE_TONE[s]}`} />
                  {s}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-rose-400" />
                THREAT PING
              </span>
            </div>
            {hosts.length === 0 && (
              <div className="absolute inset-x-0 bottom-16 text-center text-[13px] text-soc-dim">
                No endpoints scored yet. Start a capture to populate the scope.
              </div>
            )}
          </div>
        </Tile>

        {/* Trust index */}
        <Tile i={1} className="flex flex-col p-6 lg:col-span-4">
          <TileHead label="Network trust index" meta={`${deviceTrusts.length} hosts`} />
          <div className="flex flex-1 items-center justify-center py-4">
            <TrustGauge value={trustIndex} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STATES.map((s) => (
              <div key={s} className="text-center">
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`bar-fill h-full w-full ${STATE_TONE[s]}`}
                    style={{ transform: `scaleX(${(stateDist[s] || 0) / stateTotal})` }}
                  />
                </div>
                <p className="mt-2 font-mono text-[9.5px] tracking-[0.12em] text-soc-dim">{s}</p>
                <p className="font-mono text-[13px] text-soc-text">{stateDist[s] || 0}</p>
              </div>
            ))}
          </div>
        </Tile>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-6 lg:col-span-4">
          {kpis.map((k, idx) => {
            const Icon = k.icon;
            return (
              <Tile key={k.label} i={2 + idx} className="p-0">
                <button
                  type="button"
                  onClick={() => onNavigate(k.page)}
                  className="group flex h-full w-full flex-col justify-between rounded-[20px] p-5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden="true" className={`h-4 w-4 ${k.hot ? 'text-rose-300' : 'text-soc-dim'}`} />
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-soc-dim opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </div>
                  <div className="mt-6">
                    <AnimatedNumber
                      value={k.value}
                      duration={900}
                      className={`block text-[34px] font-light leading-none tracking-[-0.05em] ${k.hot ? 'text-rose-200' : 'text-soc-text'}`}
                    />
                    <p className="mt-2 text-[12px] leading-tight text-soc-dim">{k.label}</p>
                  </div>
                  <div className="mt-3 h-[22px]">
                    {k.spark && <Sparkline values={rateHistory} width={120} height={22} className="w-full" color={isCapturing ? 'rgb(194 234 110)' : 'rgb(125 146 169)'} />}
                  </div>
                </button>
              </Tile>
            );
          })}
        </div>

        {/* Severity */}
        <Tile i={6} className="p-6 lg:col-span-4">
          <TileHead label="Incident severity" meta={`${metrics.total_threats} total`} />
          <div className="mt-6 flex h-40 items-end gap-3">
            {SEVERITIES.map((s, i) => {
              const v = sevDist[s] || 0;
              return (
                <div key={s} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="font-mono text-[12px] text-soc-text">{v}</span>
                  <div className="relative w-full flex-1 overflow-hidden rounded-[10px] bg-white/[0.035]">
                    <div
                      className={`bar-fill-y absolute inset-x-0 bottom-0 h-full rounded-[10px] ${SEV_TONE[s]}`}
                      style={{ transform: `scaleY(${v / sevMax})`, ['--i' as string]: i }}
                    />
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-soc-dim">{SEV_SHORT[s]}</span>
                </div>
              );
            })}
          </div>
        </Tile>

        {/* Protocol mix */}
        <Tile i={7} className="p-6 lg:col-span-4">
          <TileHead label="Protocol mix" meta={`${protoTotal === 1 && !protoEntries.length ? 0 : protoTotal} packets`} />
          <div className="mt-6 flex h-3 gap-1 overflow-hidden rounded-full">
            {protoEntries.length ? (
              protoEntries.map(([name, v], i) => (
                <div key={name} className="h-full overflow-hidden rounded-full" style={{ flexGrow: v, flexBasis: 0 }}>
                  <div className={`bar-fill h-full w-full ${PROTO_TONE[i % PROTO_TONE.length]}`} style={{ animationDelay: `${i * 90 + 200}ms` }} />
                </div>
              ))
            ) : (
              <div className="h-full w-full rounded-full bg-white/[0.05]" />
            )}
          </div>
          <ul className="mt-6 space-y-2.5">
            {protoEntries.slice(0, 5).map(([name, v], i) => (
              <li key={name} className="flex items-center justify-between font-mono text-[12px]">
                <span className="flex items-center gap-2.5 text-soc-muted">
                  <span className={`h-2 w-2 rounded-[3px] ${PROTO_TONE[i % PROTO_TONE.length]}`} />
                  {name}
                </span>
                <span className="text-soc-text">
                  {v}
                  <span className="ml-2 inline-block w-11 text-right text-soc-dim">{((v / protoTotal) * 100).toFixed(1)}%</span>
                </span>
              </li>
            ))}
            {!protoEntries.length && <li className="text-[13px] text-soc-dim">No traffic recorded yet.</li>}
          </ul>
        </Tile>

        {/* Top offenders */}
        <Tile i={8} className="p-6 lg:col-span-4">
          <TileHead label="Repeat offenders" meta={<button className="pointer-events-auto text-signal-300 hover:text-signal-200" onClick={() => onNavigate('repeat-offenders')}>View all</button>} />
          <ul className="mt-5 space-y-3">
            {(reports?.top_offenders || []).slice(0, 4).map((o: any) => (
              <li key={o.entity_id} className="inset-well flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] text-soc-text">{o.ip}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.08em] text-soc-dim">{o.escalation_state.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-right">
                  <span className="block text-[22px] font-light leading-none tracking-[-0.04em] text-rose-200">{o.incident_count}</span>
                  <span className="font-mono text-[9.5px] text-soc-dim">incidents</span>
                </span>
              </li>
            ))}
            {!(reports?.top_offenders || []).length && <li className="py-6 text-center text-[13px] text-soc-dim">No host has re-offended.</li>}
          </ul>
        </Tile>

        {/* Threat timeline */}
        <Tile i={9} className="p-6 lg:col-span-7">
          <TileHead label="Recent threats" meta={<button className="text-signal-300 hover:text-signal-200" onClick={() => onNavigate('threats')}>Open detection</button>} />
          <ol className="relative mt-5 space-y-1 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-white/[0.07]">
            {recentThreats.length ? (
              recentThreats.map((t, i) => (
                <li key={t.id} className="tile-in relative flex items-start gap-4 rounded-xl py-2.5 pl-0 pr-2" style={{ ['--i' as string]: i + 3 }}>
                  <span className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-soc-card ${SEV_TONE[String(t.severity).toUpperCase()] || 'bg-ice-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-medium text-soc-text">{humanize(t.category)}</span>
                      <SeverityBadge severity={t.severity} />
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-soc-dim">
                      {t.src_ip} · {t.rule_id}
                    </p>
                  </div>
                  <span className="shrink-0 pt-1 font-mono text-[10.5px] text-soc-dim">{relTime(t.timestamp)}</span>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-[13px] text-soc-dim">Quiet so far. Threats appear here the moment they're detected.</li>
            )}
          </ol>
        </Tile>

        {/* Policy decisions */}
        <Tile i={10} className="p-6 lg:col-span-5">
          <TileHead label="Latest policy decisions" meta={<button className="text-signal-300 hover:text-signal-200" onClick={() => onNavigate('zt-decisions')}>View policy</button>} />
          <ul className="mt-5 divide-y divide-white/[0.05]">
            {decisions.length ? (
              decisions.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TrustBadge state={d.decision} />
                      <span className="truncate font-mono text-[12px] text-soc-text">{d.entity_id}</span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-soc-dim">{d.reason}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] text-soc-dim">{relTime(d.timestamp)}</span>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-[13px] text-soc-dim">No policy decisions logged yet.</li>
            )}
          </ul>
        </Tile>
      </div>
    </div>
  );
};
