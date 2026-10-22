import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Measures the active item inside a horizontal container so a single
 * indicator element can glide between items (spatial consistency).
 */
export function useSlidingIndicator(activeKey: string | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [rect, setRect] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const el = activeKey ? itemRefs.current[activeKey] : null;
      setRect(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    const box = containerRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    // Web fonts change label widths after first paint
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [activeKey]);

  // Enable gliding only after first placement so it never slides in from 0
  useLayoutEffect(() => {
    if (!rect || ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [rect, ready]);

  const register = (key: string) => (el: HTMLElement | null) => {
    itemRefs.current[key] = el;
  };

  return { containerRef, register, rect, ready };
}
