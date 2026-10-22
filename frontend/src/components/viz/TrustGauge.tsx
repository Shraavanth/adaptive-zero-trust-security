import React, { useEffect, useState } from 'react';
import { AnimatedNumber } from '../AnimatedNumber';

interface TrustGaugeProps {
  value: number; // 0..100
  size?: number;
}

const bandColor = (v: number) =>
  v >= 80 ? 'rgb(194 234 110)' : v >= 60 ? 'rgb(235 183 95)' : v >= 30 ? 'rgb(232 147 93)' : 'rgb(242 122 110)';

const bandLabel = (v: number) => (v >= 80 ? 'Trusted' : v >= 60 ? 'Monitor' : v >= 30 ? 'Restrict' : 'Isolate');

/** 270° arc that draws to the network's mean trust and eases between readings. */
export const TrustGauge: React.FC<TrustGaugeProps> = ({ value, size = 220 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const stroke = 10;
  const r = size / 2 - stroke - 8;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const shown = mounted ? Math.max(0, Math.min(100, value)) : 0;
  const offset = arc * (1 - shown / 100);
  const color = bandColor(value);
  const ticks = Array.from({ length: 41 }, (_, i) => i);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]" aria-hidden="true">
        {ticks.map((i) => {
          const a = (i / 40) * 1.5 * Math.PI;
          const r0 = r + stroke / 2 + 5;
          const r1 = r0 + (i % 10 === 0 ? 6 : 3);
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * r0}
              y1={size / 2 + Math.sin(a) * r0}
              x2={size / 2 + Math.cos(a) * r1}
              y2={size / 2 + Math.sin(a) * r1}
              stroke={i / 40 <= shown / 100 ? color : 'rgb(255 255 255 / 0.14)'}
              strokeOpacity={i / 40 <= shown / 100 ? 0.8 : 1}
              strokeWidth={1}
              style={{ transition: `stroke 300ms ease ${i * 18}ms` }}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth={stroke} strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle
          className="arc-draw"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 10px ${color.replace(')', ' / 0.45)')})`, transition: 'stroke-dashoffset 1400ms var(--ease-out), stroke 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={Math.round(value)} duration={1400} className="text-[64px] font-light leading-none tracking-[-0.06em] text-soc-text" />
        <span className="mt-1 font-display text-[19px] italic text-soc-muted">{bandLabel(value).toLowerCase()} posture</span>
      </div>
    </div>
  );
};
