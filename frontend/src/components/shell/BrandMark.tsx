import React from 'react';

/** Shield mark with a radar sweep that only turns while capture is live. */
export const BrandMark: React.FC<{ live: boolean; onClick: () => void }> = ({ live, onClick }) => (
  <button type="button" onClick={onClick} className="group flex items-center gap-3 rounded-full pr-2" aria-label="Go to overview">
    <span className="glass relative grid h-10 w-10 place-items-center overflow-hidden rounded-[13px]">
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: live ? 1 : 0,
          background: 'conic-gradient(from 0deg, transparent 0deg, rgb(194 234 110 / 0%) 250deg, rgb(194 234 110 / 35%) 360deg)',
          animation: 'spin 2.4s linear infinite',
        }}
      />
      <svg viewBox="0 0 24 24" className="relative h-[22px] w-[22px]" fill="none" aria-hidden="true">
        <path d="M12 21.5s7.5-3.6 7.5-9.4V5.4L12 2.6 4.5 5.4v6.7c0 5.8 7.5 9.4 7.5 9.4z" stroke="rgb(194 234 110)" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="12" cy="11.5" r="2.2" fill="rgb(194 234 110)" />
      </svg>
    </span>
    <span className="hidden whitespace-nowrap text-left leading-none sm:block">
      <span className="block text-[13px] font-medium tracking-[-0.01em] text-soc-text">Adaptive</span>
      <span className="block font-display text-[17px] italic leading-[0.95] text-signal-300">zero trust</span>
    </span>
  </button>
);
