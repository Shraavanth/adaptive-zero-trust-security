import React from 'react';
import { Search } from 'lucide-react';
import { NAV_GROUPS } from '../../lib/nav';
import { useSlidingIndicator } from '../useSlidingIndicator';

interface NavIslandProps {
  activeGroup: string;
  threatCount: number;
  onSelectGroup: (groupId: string) => void;
  onOpenCommand: () => void;
}

/** Floating glass pill: one indicator glides between the five sections. */
export const NavIsland: React.FC<NavIslandProps> = ({ activeGroup, threatCount, onSelectGroup, onOpenCommand }) => {
  const { containerRef, register, rect, ready } = useSlidingIndicator(activeGroup);

  return (
    <nav aria-label="Sections" className="glass hidden items-center gap-1 rounded-full p-1.5 lg:flex">
      <div ref={containerRef} className="relative flex items-center">
        {rect && (
          <span
            aria-hidden="true"
            data-ready={ready}
            className="slide-indicator absolute left-0 top-0 h-full rounded-full bg-white/[0.08] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),inset_0_1px_0_rgb(255_255_255/0.08)]"
            style={{ transform: `translateX(${rect.x}px)`, width: rect.w }}
          />
        )}
        {NAV_GROUPS.map((g) => {
          const active = g.id === activeGroup;
          return (
            <button
              key={g.id}
              ref={register(g.id)}
              type="button"
              onClick={() => onSelectGroup(g.id)}
              aria-current={active ? 'true' : undefined}
              className={`relative flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] xl:px-4 font-medium tracking-[-0.005em] transition-colors ${
                active ? 'text-soc-text' : 'text-soc-dim hover:text-soc-muted'
              }`}
            >
              {g.label}
              {g.id === 'operations' && threatCount > 0 && (
                <span
                  key={threatCount}
                  className="badge-pop grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500/15 px-1 font-mono text-[10px] font-medium text-rose-300 shadow-[inset_0_0_0_1px_rgb(242_122_110/0.35)]"
                >
                  {threatCount > 99 ? '99+' : threatCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/10" />
      <button
        type="button"
        onClick={onOpenCommand}
        aria-label="Jump to page"
        className="flex h-9 items-center gap-2 whitespace-nowrap rounded-full pl-3 pr-2 text-[13px] text-soc-dim transition-colors hover:text-soc-muted"
      >
        <Search aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="hidden 2xl:inline">Jump to</span>
        <kbd className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-soc-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">⌘K</kbd>
      </button>
    </nav>
  );
};
