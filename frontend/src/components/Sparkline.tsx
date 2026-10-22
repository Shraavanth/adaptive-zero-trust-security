import React, { useId } from 'react';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

/** Area sparkline; the path morphs between samples via CSS `d` transition. */
export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 96,
  height = 28,
  className,
  color = 'rgb(194 234 110)',
}) => {
  const gid = useId();
  const pts = values.length > 1 ? values : [0, 0];
  const max = Math.max(1, ...pts);
  const step = width / (pts.length - 1);
  const coords = pts.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} style={{ transition: 'd 600ms var(--ease-out)' }} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ transition: 'd 600ms var(--ease-out)' }}
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill={color} style={{ transition: 'cy 600ms var(--ease-out)' }} />
    </svg>
  );
};
