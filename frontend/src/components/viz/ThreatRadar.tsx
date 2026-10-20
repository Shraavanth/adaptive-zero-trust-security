import React, { useEffect, useRef } from 'react';
import { Packet } from '../../types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface RadarHost {
  id: string;
  ip: string;
  state: string;
  trust: number;
  risk: number;
}

interface ThreatRadarProps {
  hosts: RadarHost[];
  packets: Packet[];
  live: boolean;
  className?: string;
}

interface Contact {
  angle: number;
  radius: number;
  born: number;
  threat: boolean;
}

const TAU = Math.PI * 2;

const COLORS: Record<string, string> = {
  TRUSTED: '194 234 110',
  MONITOR: '235 183 95',
  RESTRICT: '232 147 93',
  ISOLATE: '242 122 110',
};

/** FNV-1a — stable placement for an IP across renders and sessions */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const angleFor = (key: string) => ((hash(key) % 3600) / 3600) * TAU;

/** Trusted hosts sit near the core; untrusted drift to the quarantine rim. */
const radiusForTrust = (trust: number) => 0.16 + 0.76 * (1 - Math.max(0, Math.min(100, trust)) / 100);

const BANDS = [
  { label: 'TRUSTED', at: radiusForTrust(80) },
  { label: 'MONITOR', at: radiusForTrust(60) },
  { label: 'RESTRICT', at: radiusForTrust(30) },
  { label: 'ISOLATE', at: 1 },
];

/**
 * A live scope of the network. The sweep is decorative only in the sense
 * that it reveals: hosts glow as it passes and fade with phosphor decay,
 * clean packets flicker as faint contacts, and malicious packets ring out
 * from the offending host.
 */
export const ThreatRadar: React.FC<ThreatRadarProps> = ({ hosts, packets, live, className }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  const hostsRef = useRef(hosts);
  const liveRef = useRef(live);
  const contactsRef = useRef<Contact[]>([]);
  const seenRef = useRef<Set<number> | null>(null);
  const drawRef = useRef<(now: number) => void>(() => {});

  hostsRef.current = hosts;
  liveRef.current = live;

  // Turn newly streamed packets into contacts on the scope
  useEffect(() => {
    if (seenRef.current === null) {
      seenRef.current = new Set(packets.map((p) => p.id));
      return;
    }
    const seen = seenRef.current;
    const now = performance.now();
    for (const p of packets) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const threat = p.detection_status === 'MALICIOUS' || p.detection_status === 'SUSPICIOUS';
      const host = hostsRef.current.find((h) => h.ip === p.src_ip);
      if (threat) {
        contactsRef.current.push({
          angle: host ? angleFor(host.ip) : angleFor(p.src_ip),
          radius: host ? radiusForTrust(host.trust) : 0.82,
          born: now,
          threat: true,
        });
      } else {
        const key = p.dst_ip || p.src_ip;
        contactsRef.current.push({
          angle: angleFor(key),
          radius: 0.4 + ((hash(key) >>> 12) % 1000) / 1000 * 0.58,
          born: now,
          threat: false,
        });
      }
    }
    if (contactsRef.current.length > 160) contactsRef.current.splice(0, contactsRef.current.length - 160);
    if (seen.size > 2000) seenRef.current = new Set(packets.map((p) => p.id));
    if (reduce) drawRef.current(performance.now());
  }, [packets, reduce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let sweep = -Math.PI / 2;
    let lastT = performance.now();
    let frame = 0;
    let visible = true;
    let running = false;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      draw(performance.now());
    };

    const draw = (now: number) => {
      const isLive = liveRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.max(40, Math.min(w, h) / 2 - 30);

      // Core bloom
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      bloom.addColorStop(0, `rgb(194 234 110 / ${isLive ? 0.07 : 0.04})`);
      bloom.addColorStop(1, 'rgb(194 234 110 / 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      // Trust bands
      ctx.lineWidth = 1;
      BANDS.forEach((b, i) => {
        ctx.strokeStyle = i === BANDS.length - 1 ? 'rgb(255 255 255 / 0.12)' : 'rgb(255 255 255 / 0.055)';
        ctx.setLineDash(i === BANDS.length - 1 ? [] : [2, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, R * b.at, 0, TAU);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Crosshair
      ctx.strokeStyle = 'rgb(255 255 255 / 0.04)';
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();

      // Bearing ticks
      for (let d = 0; d < 360; d += 5) {
        const a = (d / 360) * TAU - Math.PI / 2;
        const major = d % 30 === 0;
        const r0 = R + 4;
        const r1 = R + (major ? 11 : 7);
        ctx.strokeStyle = major ? 'rgb(255 255 255 / 0.28)' : 'rgb(255 255 255 / 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgb(255 255 255 / 0.32)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      [0, 90, 180, 270].forEach((d) => {
        const a = (d / 360) * TAU - Math.PI / 2;
        ctx.fillText(String(d).padStart(3, '0'), cx + Math.cos(a) * (R + 21), cy + Math.sin(a) * (R + 21));
      });

      // Band labels along the 300° bearing
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgb(255 255 255 / 0.22)';
      ctx.font = '500 8.5px "IBM Plex Mono", ui-monospace, monospace';
      const la = (-62 / 360) * TAU - Math.PI / 2;
      BANDS.forEach((b) => {
        ctx.fillText(b.label, cx + Math.cos(la) * R * b.at + 4, cy + Math.sin(la) * R * b.at - 6);
      });

      // Sweep: phosphor wedge trailing the beam
      const trail = 0.9;
      const conic = (ctx as CanvasRenderingContext2D & { createConicGradient?: (a: number, x: number, y: number) => CanvasGradient })
        .createConicGradient;
      if (conic) {
        const g = conic.call(ctx, sweep - trail, cx, cy);
        const k = trail / TAU;
        g.addColorStop(0, 'rgb(194 234 110 / 0)');
        g.addColorStop(k, `rgb(194 234 110 / ${isLive ? 0.2 : 0.09})`);
        g.addColorStop(Math.min(1, k + 0.0001), 'rgb(194 234 110 / 0)');
        g.addColorStop(1, 'rgb(194 234 110 / 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, sweep - trail, sweep);
        ctx.closePath();
        ctx.fill();
      }
      ctx.save();
      ctx.strokeStyle = `rgb(194 234 110 / ${isLive ? 0.85 : 0.4})`;
      ctx.shadowColor = 'rgb(194 234 110 / 0.8)';
      ctx.shadowBlur = isLive ? 12 : 4;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();
      ctx.restore();

      // Contacts from live traffic
      const contacts = contactsRef.current;
      for (let i = contacts.length - 1; i >= 0; i--) {
        const c = contacts[i];
        const life = c.threat ? 2200 : 1100;
        const age = (now - c.born) / life;
        if (age >= 1) {
          contacts.splice(i, 1);
          continue;
        }
        const a = c.angle - Math.PI / 2;
        const x = cx + Math.cos(a) * R * c.radius;
        const y = cy + Math.sin(a) * R * c.radius;
        const fade = 1 - age;
        if (c.threat) {
          const eased = 1 - Math.pow(1 - age, 3);
          ctx.strokeStyle = `rgb(242 122 110 / ${0.9 * fade})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(x, y, 4 + eased * 46, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = `rgb(242 122 110 / ${0.45 * fade})`;
          ctx.beginPath();
          ctx.arc(x, y, 4 + eased * 24, 0, TAU);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgb(205 238 133 / ${0.75 * fade})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, TAU);
          ctx.fill();
        }
      }

      // Hosts
      ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      for (const host of hostsRef.current) {
        const ang = angleFor(host.ip);
        const a = ang - Math.PI / 2;
        const rr = R * radiusForTrust(host.trust);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        const rgb = COLORS[host.state] ?? '157 176 196';
        // Phosphor afterglow: brightest right after the beam passes
        let since = (sweep + Math.PI / 2 - ang) % TAU;
        if (since < 0) since += TAU;
        const glow = reduce ? 0.6 : Math.exp(-since * 0.9);
        const alpha = 0.4 + 0.6 * glow;

        const halo = ctx.createRadialGradient(x, y, 0, x, y, 16 + glow * 10);
        halo.addColorStop(0, `rgb(${rgb} / ${0.35 * alpha})`);
        halo.addColorStop(1, `rgb(${rgb} / 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, TAU);
        ctx.fill();

        if (host.state === 'ISOLATE' && !reduce) {
          const p = (now % 1800) / 1800;
          ctx.strokeStyle = `rgb(${rgb} / ${0.6 * (1 - p)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 5 + p * 14, 0, TAU);
          ctx.stroke();
        }

        ctx.fillStyle = `rgb(${rgb} / ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, TAU);
        ctx.fill();

        const right = Math.cos(a) >= 0;
        ctx.textAlign = right ? 'left' : 'right';
        ctx.fillStyle = `rgb(233 238 243 / ${0.35 + 0.45 * glow})`;
        ctx.fillText(host.ip, x + (right ? 10 : -10), y);
      }

      // Core: the gateway
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgb(194 234 110)';
      ctx.shadowColor = 'rgb(194 234 110 / 0.9)';
      ctx.shadowBlur = 10;
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.restore();
    };
    drawRef.current = draw;

    const tick = (now: number) => {
      const dt = Math.min(64, now - lastT);
      lastT = now;
      const period = liveRef.current ? 4200 : 9000;
      sweep = (sweep + (dt / period) * TAU) % TAU;
      draw(now);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      lastT = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // Only animate while on screen and the tab is visible
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce]);

  // Under reduced motion the scope is a still frame, redrawn when data changes
  useEffect(() => {
    if (reduce) drawRef.current(performance.now());
  }, [hosts, live, reduce]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Threat radar: ${hosts.length} monitored endpoint${hosts.length === 1 ? '' : 's'} placed by trust score`}
      />
    </div>
  );
};
