import React, { useEffect } from 'react';
import { NAV_GROUPS } from '../../lib/nav';

interface MobileMenuProps {
  open: boolean;
  activePage: string;
  onNavigate: (pageId: string) => void;
  onClose: () => void;
}

/** Full-screen glass sheet; links rise out of their rows in sequence. */
export const MobileMenu: React.FC<MobileMenuProps> = ({ open, activePage, onNavigate, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  let i = 0;
  return (
    <div
      id="mobile-menu"
      data-state={open ? 'open' : 'closed'}
      aria-hidden={!open}
      className="menu-sheet fixed inset-0 z-[39] overflow-y-auto bg-[#07090d]/85 px-6 pb-16 pt-24 backdrop-blur-2xl lg:hidden"
    >
      <nav aria-label="All pages" className="mx-auto grid max-w-md gap-8">
        {NAV_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="label-caps menu-link" style={{ ['--i' as string]: i++ }}>{g.label}</p>
            <ul className="mt-3 space-y-1">
              {g.pages.map((p) => (
                <li key={p.id} className="overflow-hidden">
                  <button
                    type="button"
                    tabIndex={open ? 0 : -1}
                    onClick={() => onNavigate(p.id)}
                    style={{ ['--i' as string]: i++ }}
                    className={`menu-link block w-full py-1 text-left text-[26px] font-medium tracking-[-0.03em] ${
                      p.id === activePage ? 'text-signal-300' : 'text-soc-text'
                    }`}
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};
