import React, { useEffect, useRef } from 'react';
import { Packet } from '../../types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PacketStreamProps {
  packets: Packet[];
  live: boolean;
  className?: string;
}

interface Comet {
  lane: number;
  born: number;
  speed: number; // ms to cross
  len: number;
  threat: boolean;
  jitter: number;
}

const LANES = ['TCP', 'UDP', 'DNS', 'ARP', 'ICMP', 'OTHER'];
const laneOf = (p: Packet) => {
  const proto = String(p.protocol).toUpperCase();
  const i = LANES.indexOf(proto);
  return i === -1 ? LANES.length - 1 : i;
};

/**
 * Each streamed packet crosses its protocol lane as a comet. Trail length
 * follows packet size; malicious traffic streaks faster in coral and flares
 * as it reaches the inspection line.
 */
export const PacketStream: React.FC<PacketStreamProps> = ({ packets, live, className }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const cometsRef = useRef<Comet[]>([]);
  const countsRef = useRef<number[]>(LANES.map(() => 0));
  const flaresRef = useRef<{ lane: number; born: number }[]>([]);
  const seenRef = useRef<Set<number> | null>(null);
  const liveRef = useRef(live);
  const drawRef = useRef<(now: number) => void>(() => {});
  liveRef.current = live;

  useEffect(() => {
    if (seenRef.current === null) {
      seenRef.current = new Set(packets.map((p) => p.id));
      return;
    }
    const now = performance.now();
    for (const p of packets) {
      if (seenRef.current.has(p.id)) continue;
      seenRef.current.add(p.id);
      const threat = p.detection_status === 'MALICIOUS' || p.detection_status === 'SUSPICIOUS';
      const lane = laneOf(p);
      countsRef.current[lane] += 1;
      cometsRef.current.push({
        lane,
        born: now,
        speed: threat ? 1100 : 1700 + Math.random() * 500,
        len: Math.min(220, 40 + (p.length || 64) * 0.12),
        threat,
        jitter: (Math.random() - 0.5) * 8,
      });
    }
    if (cometsRef.current.length > 200) cometsRef.current.splice(0, cometsRef.current.length - 200);
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
    let frame = 0;
    let running = false;
    let visible = true;

    const gutter = 64; // lane labels
    const inspectX = () => w - 56;

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const top = 18;
      const laneH = (h - top * 2) / LANES.length;
      const x0 = gutter;
      const x1 = inspectX();

      // Lanes
      LANES.forEach((name, i) => {
        const y = top + laneH * (i + 0.5);
        ctx.strokeStyle = 'rgb(255 255 255 / 0.05)';
        ctx.setLineDash([1, 6]);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgb(233 238 243 / 0.55)';
        ctx.fillText(name, 16, y - 6);
        ctx.fillStyle = 'rgb(123 136 152 / 0.9)';
        ctx.font = '400 9px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillText(String(countsRef.current[i]).padStart(4, '0'), 16, y + 7);
      });

      // Inspection line
      const grad = ctx.createLinearGradient(0, top, 0, h - top);
      grad.addColorStop(0, 'rgb(194 234 110 / 0)');
      grad.addColorStop(0.5, `rgb(194 234 110 / ${liveRef.current ? 0.55 : 0.2})`);
      grad.addColorStop(1, 'rgb(194 234 110 / 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, top);
      ctx.lineTo(x1, h - top);
      ctx.stroke();
      ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgb(194 234 110 / 0.6)';
      ctx.fillText('DPI', x1 + 26, h / 2);

      // Comets
      const comets = cometsRef.current;
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        const t = (now - c.born) / c.speed;
        if (t >= 1) {
          if (c.threat) flaresRef.current.push({ lane: c.lane, born: now });
          comets.splice(i, 1);
          continue;
        }
        // Ease-out cubic in, so packets arrive quickly and settle into the line
        const p = 1 - Math.pow(1 - t, 2.2);
        const x = x0 + (x1 - x0) * p;
        const y = top + laneH * (c.lane + 0.5) + c.jitter;
        const rgb = c.threat ? '242 122 110' : '194 234 110';
        const tail = ctx.createLinearGradient(x - c.len, y, x, y);
        tail.addColorStop(0, `rgb(${rgb} / 0)`);
        tail.addColorStop(1, `rgb(${rgb} / ${c.threat ? 0.95 : 0.6})`);
        ctx.strokeStyle = tail;
        ctx.lineWidth = c.threat ? 2 : 1.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(Math.max(x0, x - c.len), y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.save();
        ctx.fillStyle = `rgb(${rgb})`;
        ctx.shadowColor = `rgb(${rgb} / 0.9)`;
        ctx.shadowBlur = c.threat ? 14 : 8;
        ctx.beginPath();
        ctx.arc(x, y, c.threat ? 2.6 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Flares where threats hit the inspection line
      const flares = flaresRef.current;
      for (let i = flares.length - 1; i >= 0; i--) {
        const f = flares[i];
        const age = (now - f.born) / 900;
        if (age >= 1) {
          flares.splice(i, 1);
          continue;
        }
        const y = top + laneH * (f.lane + 0.5);
        const e = 1 - Math.pow(1 - age, 3);
        ctx.strokeStyle = `rgb(242 122 110 / ${0.8 * (1 - age)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(x1, y, 3 + e * 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!liveRef.current && comets.length === 0) {
        ctx.font = '400 12px "Instrument Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgb(123 136 152 / 0.9)';
        ctx.fillText('Stream idle. Start a capture to watch packets cross the inspection line.', (x0 + x1) / 2, h / 2);
      }
    };
    drawRef.current = draw;

    const tick = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
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

  useEffect(() => {
    if (reduce) drawRef.current(performance.now());
  }, [live, reduce]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} role="img" aria-label="Packet stream: live packets crossing protocol lanes toward the inspection line" />
    </div>
  );
};
