import { useEffect, useState } from 'react';

/**
 * Keeps the last non-null value mounted long enough to animate out.
 * `open` flips true a frame after mount so CSS transitions see the closed
 * state first, and flips false immediately on close so the exit can play.
 */
export function usePresence<T>(value: T | null | undefined, exitMs: number) {
  const [rendered, setRendered] = useState<T | null>(value ?? null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value != null) {
      setRendered(value);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setOpen(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setOpen(false);
    const timer = window.setTimeout(() => setRendered(null), exitMs);
    return () => window.clearTimeout(timer);
  }, [value, exitMs]);

  return {
    rendered: value ?? rendered,
    state: (value != null && open ? 'open' : 'closed') as 'open' | 'closed',
  };
}
