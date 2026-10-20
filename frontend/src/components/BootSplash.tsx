import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const SESSION_KEY = 'azt-boot-played';
const HOLD_MS = 2050;
const EXIT_MS = 800;

const CHECKS = [
  { label: 'capture engine', status: 'ready', at: 520 },
  { label: 'trust baselines', status: 'loaded', at: 760 },
  { label: 'policy engine', status: 'armed', at: 1000 },
];

const alreadyPlayed = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

const markPlayed = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage unavailable — the intro may replay, which is harmless */
  }
};

/**
 * First-load identity sequence (once per browser session): the scope's rings
 * draw in, the sweep spins up, the wordmark rises out of its masks, system
 * checks report in, then the whole curtain wipes upward onto the console.
 * Click or any key skips it; reduced motion never plays it.
 */
export const BootSplash: React.FC = () => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'playing' | 'leaving' | 'done'>(() =>
    reduce || alreadyPlayed() ? 'done' : 'playing'
  );

  useEffect(() => {
    if (phase === 'done') return;
    markPlayed();
    if (phase === 'playing') {
      const t = window.setTimeout(() => setPhase('leaving'), HOLD_MS);
      const skip = () => setPhase('leaving');
      window.addEventListener('keydown', skip, { once: true });
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('keydown', skip);
      };
    }
    const t = window.setTimeout(() => setPhase('done'), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className="boot fixed inset-0 z-boot flex items-center justify-center overflow-hidden bg-soc-bg"
      data-state={phase}
      onClick={() => setPhase('leaving')}
      role="presentation"
    >
      <div aria-hidden="true" className="ambient-grid" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgb(194 234 110 / 9%), transparent 60%)' }}
      />

      <div className="boot-stage relative flex flex-col items-center px-6">
        {/* Scope */}
        <div className="relative h-44 w-44 sm:h-52 sm:w-52">
          <div
            aria-hidden="true"
            className="boot-sweep absolute inset-[6%] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgb(194 234 110 / 0.32) 360deg)',
              mask: 'radial-gradient(circle, #000 69%, transparent 70%)',
              WebkitMask: 'radial-gradient(circle, #000 69%, transparent 70%)',
            }}
          />
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
            {[92, 66, 40].map((r, i) => (
              <circle
                key={r}
                className="boot-ring"
                cx="100"
                cy="100"
                r={r}
                pathLength={1}
                transform="rotate(-90 100 100)"
                stroke={i === 0 ? 'rgb(194 234 110 / 0.75)' : 'rgb(255 255 255 / 0.14)'}
                strokeWidth={i === 0 ? 1.25 : 1}
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
            {Array.from({ length: 72 }, (_, i) => {
              const a = (i / 72) * Math.PI * 2;
              const major = i % 6 === 0;
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(a) * 96}
                  y1={100 + Math.sin(a) * 96}
                  x2={100 + Math.cos(a) * (major ? 103 : 99.5)}
                  y2={100 + Math.sin(a) * (major ? 103 : 99.5)}
                  stroke="rgb(255 255 255 / 0.25)"
                  strokeWidth={0.75}
                  className="boot-tick"
                  style={{ animationDelay: `${300 + i * 6}ms` }}
                />
              );
            })}
            <path
              className="boot-ring"
              pathLength={1}
              d="M100 140s26-12.4 26-32.6V84.3L100 74.5l-26 9.8v23.1c0 20.2 26 32.6 26 32.6z"
              stroke="rgb(194 234 110)"
              strokeWidth={1.4}
              strokeLinejoin="round"
              style={{ animationDelay: '420ms' }}
            />
            <circle cx="100" cy="104" r="5" fill="rgb(194 234 110)" className="boot-tick" style={{ animationDelay: '1000ms' }} />
          </svg>
        </div>

        {/* Wordmark */}
        <h1 className="mt-10 text-center text-[44px] font-medium leading-none tracking-[-0.03em] text-soc-text sm:text-[60px]">
          <span className="reveal-line">
            <span className="reveal-word" style={{ ['--w' as string]: 6 }}>Adaptive</span>
          </span>{' '}
          <span className="reveal-line">
            <span className="reveal-word font-display font-normal italic tracking-[-0.02em] text-signal-300" style={{ ['--w' as string]: 8 }}>
              zero trust
            </span>
          </span>
        </h1>

        {/* System checks */}
        <ul className="mt-9 w-72 space-y-2 font-mono text-[11px] text-soc-dim">
          {CHECKS.map((c) => (
            <li key={c.label} className="boot-line flex items-baseline gap-2" style={{ animationDelay: `${c.at}ms` }}>
              <span className="text-soc-muted">{c.label}</span>
              <span aria-hidden="true" className="flex-1 overflow-hidden whitespace-nowrap text-white/15">
                ····································
              </span>
              <span className="text-signal-300">{c.status}</span>
            </li>
          ))}
        </ul>

        <div className="boot-line mt-7 h-px w-72 overflow-hidden bg-white/10" style={{ animationDelay: '300ms' }}>
          <div className="boot-progress h-full w-full bg-signal-400 shadow-[0_0_12px_rgb(194_234_110/0.8)]" />
        </div>
        <p className="boot-line mt-4 font-mono text-[10px] tracking-[0.18em] text-white/25" style={{ animationDelay: '1200ms' }}>
          CLICK OR PRESS ANY KEY TO SKIP
        </p>
      </div>
    </div>
  );
};
