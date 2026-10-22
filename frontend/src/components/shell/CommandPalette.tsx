import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { ALL_PAGES } from '../../lib/nav';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (pageId: string) => void;
}

/**
 * Keyboard-first page switcher. Deliberately has no open/close animation:
 * it is summoned by shortcut many times a day, and motion would only slow it.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_PAGES;
    return ALL_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.group.label.toLowerCase().includes(q) || p.title.join(' ').toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  if (!open) return null;

  const choose = (id: string) => {
    onNavigate(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && results[cursor]) {
      choose(results[cursor].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to page"
        className="glass w-full max-w-lg overflow-hidden rounded-[22px]"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5">
          <Search aria-hidden="true" className="h-4 w-4 text-soc-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page…"
            aria-label="Search pages"
            className="h-14 flex-1 bg-transparent text-[15px] text-soc-text placeholder:text-soc-dim focus:outline-none"
          />
          <kbd className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-soc-dim">ESC</kbd>
        </div>
        <ul role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-soc-dim">No page matches “{query}”.</li>}
          {results.map((p, i) => {
            const Icon = p.icon;
            const active = i === cursor;
            return (
              <li key={p.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active ? 'bg-white/[0.07]' : ''}`}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? 'bg-signal-400/15 text-signal-300' : 'bg-white/[0.04] text-soc-dim'}`}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13.5px] text-soc-text">{p.label}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-soc-dim">{p.group.label}</span>
                  </span>
                  {active && <CornerDownLeft aria-hidden="true" className="h-3.5 w-3.5 text-soc-dim" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
