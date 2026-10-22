import React from 'react';

/**
 * Fixed, non-interactive stage behind the app: a faded grid, two slow light
 * orbs (transform-only drift) and a coral bloom that rises while threats are
 * actively arriving. Grain sits above everything at very low opacity.
 */
export const Ambient: React.FC<{ threat: boolean }> = ({ threat }) => (
  <>
    <div aria-hidden="true" className="ambient" data-threat={threat}>
      <div className="ambient-orb ambient-orb--signal" />
      <div className="ambient-orb ambient-orb--ice" />
      <div className="ambient-orb ambient-orb--threat" />
      <div className="ambient-grid" />
    </div>
    <div aria-hidden="true" className="grain" style={{ zIndex: 75 }} />
  </>
);
