import React from 'react';
import { NavGroup, NavPage } from '../../lib/nav';
import { useSlidingIndicator } from '../useSlidingIndicator';

interface PageHeroProps {
  group: NavGroup;
  page: NavPage;
  onNavigate: (pageId: string) => void;
}

const Words: React.FC<{ text: string; offset: number; className?: string }> = ({ text, offset, className }) => (
  <>
    {text.split(' ').map((w, i) => (
      <span key={`${w}-${i}`} className="reveal-line">
        <span className={`reveal-word ${className ?? ''}`} style={{ ['--w' as string]: offset + i }}>
          {w}
        </span>
        {' '}
      </span>
    ))}
  </>
);

/**
 * Section eyebrow, masked headline reveal, and the section's sub-pages as a
 * segmented control with a gliding pill.
 */
export const PageHero: React.FC<PageHeroProps> = ({ group, page, onNavigate }) => {
  const { containerRef, register, rect, ready } = useSlidingIndicator(page.id);
  const index = group.pages.findIndex((p) => p.id === page.id) + 1;
  const [lead, tail] = page.title;
  const leadCount = lead.split(' ').length;

  return (
    <section className="pb-2 pt-10 sm:pt-14 lg:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="min-w-0">
          <span className="eyebrow">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-signal-400" />
            {group.label}
            <span className="text-soc-dim">
              {String(index).padStart(2, '0')} / {String(group.pages.length).padStart(2, '0')}
            </span>
          </span>
          <h1
            key={page.id}
            className="mt-5 text-[40px] font-medium leading-[1.02] tracking-[-0.03em] text-soc-text sm:text-[56px] lg:text-[64px]"
          >
            <Words text={lead} offset={0} />
            <Words text={tail} offset={leadCount} className="pr-[0.06em] font-display font-normal italic tracking-[-0.02em] text-signal-300" />
          </h1>
        </div>

        {group.pages.length > 1 && (
          <div className="no-scrollbar -mx-3 max-w-[calc(100%+1.5rem)] overflow-x-auto px-3 pb-1 sm:mx-0 sm:max-w-full sm:px-0">
            <div ref={containerRef} role="tablist" aria-label={`${group.label} pages`} className="panel-flat relative flex w-max items-center rounded-full p-1">
              {rect && (
                <span
                  aria-hidden="true"
                  data-ready={ready}
                  className="slide-indicator absolute left-0 top-1 h-[calc(100%-8px)] rounded-full bg-signal-400 shadow-[0_6px_20px_-6px_rgb(194_234_110/0.6)]"
                  style={{ transform: `translateX(${rect.x}px)`, width: rect.w }}
                />
              )}
              {group.pages.map((p) => {
                const active = p.id === page.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    ref={register(p.id)}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => onNavigate(p.id)}
                    className={`relative flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-300 ${
                      active ? 'text-[#0b1006]' : 'text-soc-dim hover:text-soc-text'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
