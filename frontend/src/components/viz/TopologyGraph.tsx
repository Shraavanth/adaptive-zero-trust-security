import React, { useMemo, useState } from 'react';

export interface TopoNode {
  id: string;
  label: string;
  type: string;
  ip: string;
  status: string;
  category?: string;
  trust_score?: number;
  risk_score?: number;
}

export interface TopoLink {
  source: string;
  target: string;
  protocol: string;
  packet_count: number;
  is_malicious: boolean;
}

interface TopologyGraphProps {
  nodes: TopoNode[];
  links: TopoLink[];
  selectedId: string | null;
  onSelect: (node: TopoNode) => void;
}

const W = 820;
const H = 640;
const CX = W / 2;
const CY = H / 2;
const RING = { decoy: 112, host: 200, external: 284 };

const isPrivate = (ip: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)/.test(ip);

const STATE_RGB: Record<string, string> = {
  TRUSTED: '194 234 110',
  MONITOR: '235 183 95',
  RESTRICT: '232 147 93',
  ISOLATE: '242 122 110',
  HONEYPOT: '157 176 196',
};

interface Placed extends TopoNode {
  x: number;
  y: number;
  ring: keyof typeof RING | 'core';
}

const place = (items: TopoNode[], ring: keyof typeof RING, phase: number): Placed[] =>
  items.map((n, i) => {
    const a = phase + (i / Math.max(1, items.length)) * Math.PI * 2;
    return { ...n, ring, x: CX + Math.cos(a) * RING[ring], y: CY + Math.sin(a) * RING[ring] };
  });

const hexPath = (r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join(' ') + ' Z';

/**
 * Concentric constellation: the gateway at the core, decoys on the inner
 * ring, discovered hosts on the middle ring, external peers on the rim.
 * Traffic visibly flows along each observed edge; attack edges run hot.
 */
export const TopologyGraph: React.FC<TopologyGraphProps> = ({ nodes, links, selectedId, onSelect }) => {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const { placed, edges } = useMemo(() => {
    const gateway = nodes.find((n) => n.type === 'GATEWAY');
    const decoys = nodes.filter((n) => n.type === 'HONEYPOT');
    const known = new Map(nodes.map((n) => [n.ip, n]));
    const hosts = nodes.filter((n) => n.type !== 'GATEWAY' && n.type !== 'HONEYPOT');
    const extraHosts: TopoNode[] = [];
    const externals: TopoNode[] = [];
    const seen = new Set(nodes.map((n) => n.ip));
    for (const l of links) {
      for (const ip of [l.source, l.target]) {
        if (seen.has(ip)) continue;
        seen.add(ip);
        const n: TopoNode = { id: ip, label: ip, type: isPrivate(ip) ? 'ENDPOINT' : 'EXTERNAL', ip, status: isPrivate(ip) ? 'TRUSTED' : 'EXTERNAL', category: isPrivate(ip) ? 'OBSERVED' : 'EXTERNAL' };
        (isPrivate(ip) ? extraHosts : externals).push(n);
        known.set(ip, n);
      }
    }
    const sortIp = (a: TopoNode, b: TopoNode) => a.ip.localeCompare(b.ip, undefined, { numeric: true });
    const all: Placed[] = [
      ...(gateway ? [{ ...gateway, x: CX, y: CY, ring: 'core' as const }] : []),
      ...place(decoys, 'decoy', Math.PI / 5),
      ...place([...hosts, ...extraHosts].sort(sortIp), 'host', -Math.PI / 2),
      ...place(externals.sort(sortIp), 'external', -Math.PI / 2 + 0.2),
    ];
    const byIp = new Map(all.map((n) => [n.ip, n]));
    const gw = all.find((n) => n.ring === 'core');
    const edgeList = links
      .map((l) => ({ l, a: byIp.get(l.source), b: byIp.get(l.target) }))
      .filter((e): e is { l: TopoLink; a: Placed; b: Placed } => !!e.a && !!e.b && e.a !== e.b)
      .map(({ l, a, b }, i) => {
        // Bow each edge toward the core so the web reads as routed through it
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const qx = mx + (CX - mx) * 0.45;
        const qy = my + (CY - my) * 0.45;
        return { key: `${l.source}-${l.target}-${l.protocol}-${i}`, d: `M${a.x},${a.y} Q${qx},${qy} ${b.x},${b.y}`, l, a: a.id, b: b.id };
      });
    const spokes = gw
      ? all
          .filter((n) => n.ring === 'host')
          .map((n) => ({ key: `spoke-${n.id}`, d: `M${gw.x},${gw.y} L${n.x},${n.y}`, id: n.id }))
      : [];
    return { placed: all, edges: { list: edgeList, spokes } };
  }, [nodes, links]);

  const focus = hoverId ?? selectedId;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="group" aria-label="Network topology graph">
      <defs>
        <radialGradient id="topo-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(194 234 110)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="rgb(194 234 110)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={RING.external + 30} fill="url(#topo-core)" />
      {(['decoy', 'host', 'external'] as const).map((r) => (
        <circle key={r} cx={CX} cy={CY} r={RING[r]} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeDasharray={r === 'decoy' ? '2 6' : undefined} />
      ))}
      {(['decoy', 'host', 'external'] as const).map((r) => (
        <text
          key={`t-${r}`}
          x={CX + Math.cos(Math.PI * 0.8) * RING[r] - 8}
          y={CY + Math.sin(Math.PI * 0.8) * RING[r] + 3}
          textAnchor="end"
          className="fill-white/25 font-mono"
          fontSize="8.5"
          letterSpacing="1.4"
        >
          {r === 'decoy' ? 'DECOYS' : r === 'host' ? 'HOSTS' : 'EXTERNAL'}
        </text>
      ))}

      {/* Spokes: every host is reached through the gateway */}
      {edges.spokes.map((s, i) => (
        <path
          key={s.key}
          d={s.d}
          pathLength={1}
          className="edge-draw"
          style={{ ['--i' as string]: i }}
          fill="none"
          stroke="rgb(255 255 255)"
          strokeOpacity={focus && focus !== s.id ? 0.03 : 0.08}
        />
      ))}

      {/* Observed flows */}
      {edges.list.map((e, i) => {
        const active = !focus || focus === e.a || focus === e.b;
        const rgb = e.l.is_malicious ? '242 122 110' : '194 234 110';
        return (
          <g key={e.key} style={{ opacity: active ? 1 : 0.15, transition: 'opacity 300ms ease' }}>
            <path d={e.d} pathLength={1} className="edge-draw" style={{ ['--i' as string]: i }} fill="none" stroke={`rgb(${rgb} / ${e.l.is_malicious ? 0.35 : 0.14})`} strokeWidth={1} />
            <path
              d={e.d}
              className={e.l.is_malicious ? 'edge-flow edge-flow--threat' : 'edge-flow'}
              fill="none"
              stroke={`rgb(${rgb} / ${e.l.is_malicious ? 0.95 : 0.6})`}
              strokeWidth={e.l.is_malicious ? 1.75 : 1.25}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Nodes */}
      {placed.map((n, i) => {
        const rgb = STATE_RGB[n.status] ?? '125 146 169';
        const selected = n.id === selectedId;
        const dim = focus && focus !== n.id && !edges.list.some((e) => (e.a === focus && e.b === n.id) || (e.b === focus && e.a === n.id));
        const r = n.ring === 'core' ? 13 : n.ring === 'external' ? 4 : 7;
        const select = () => onSelect(n);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x} ${n.y})`}
            style={{ opacity: dim ? 0.3 : 1, transition: 'opacity 300ms ease', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`${n.label}, ${n.status}`}
            aria-pressed={selected}
            onClick={select}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select())}
            onMouseEnter={() => setHoverId(n.id)}
            onMouseLeave={() => setHoverId(null)}
            onFocus={() => setHoverId(n.id)}
            onBlur={() => setHoverId(null)}
          >
            <g className="node-in" style={{ ['--i' as string]: i }}>
              <circle r={r + 14} fill="transparent" />
              {n.status === 'ISOLATE' && <circle className="node-halo" r={r + 3} fill="none" stroke={`rgb(${rgb})`} strokeWidth={1} />}
              {n.ring === 'core' && (
                <>
                  <circle className="node-halo" r={r + 4} fill="none" stroke="rgb(194 234 110)" strokeWidth={1} />
                  <circle r={r + 7} fill="none" stroke="rgb(194 234 110 / 0.25)" />
                </>
              )}
              {n.type === 'HONEYPOT' ? (
                <path d={hexPath(r + 2)} fill="rgb(13 17 23)" stroke={`rgb(${rgb} / 0.8)`} strokeDasharray="2 2.5" strokeWidth={1.25} />
              ) : (
                <circle r={r} fill={n.ring === 'external' ? `rgb(${rgb} / 0.5)` : 'rgb(13 17 23)'} stroke={`rgb(${rgb})`} strokeWidth={n.ring === 'core' ? 2 : 1.5} />
              )}
              {n.trust_score !== undefined && n.ring === 'host' && (
                <circle
                  r={r + 5}
                  fill="none"
                  stroke={`rgb(${rgb})`}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${n.trust_score} 100`}
                  transform="rotate(-90)"
                  opacity={0.7}
                />
              )}
              {n.ring !== 'external' && <circle r={n.ring === 'core' ? 4 : 2.2} fill={`rgb(${rgb})`} />}
              {selected && <circle r={r + 10} fill="none" stroke="rgb(233 238 243 / 0.7)" strokeWidth={1} strokeDasharray="3 3" />}
              <text
                y={r + (n.ring === 'external' ? 14 : 20)}
                textAnchor="middle"
                className="font-mono"
                fontSize={n.ring === 'external' ? 8.5 : 10}
                fill={`rgb(233 238 243 / ${n.ring === 'external' ? 0.4 : 0.7})`}
              >
                {n.ring === 'core' ? 'GATEWAY' : n.type === 'HONEYPOT' ? n.ip.replace('127.0.0.1', 'decoy') : n.ip}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
