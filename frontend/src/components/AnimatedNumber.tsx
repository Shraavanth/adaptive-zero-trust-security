import React, { useEffect, useRef, useState } from 'react';
import { easeOut } from '../lib/easing';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
  className?: string;
}

const parse = (v: string | number) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const cleaned = v.replace(/,/g, '').trim();
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
};

/**
 * Tweens numeric values from their previous value (0 on first mount) so a
 * changed metric is legible as a change. Non-numeric values render as-is.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 500, className }) => {
  const target = parse(value);
  const reduce = useReducedMotion();
  // Start from 0 so the first paint is the beginning of the count, not the end
  const [display, setDisplay] = useState(() => (reduce ? target ?? 0 : 0));
  const fromRef = useRef(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (target === null) return;
    if (reduce) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }
    fromRef.current = currentRef.current;
    const from = fromRef.current;
    if (from === target) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOut(t);
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);

  if (target === null) return <span className={className}>{value}</span>;

  const decimals = Number.isInteger(target) ? 0 : 1;
  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
};
