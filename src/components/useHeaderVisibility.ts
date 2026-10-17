import { useEffect, useState } from 'react';

/**
 * Header state from scroll position: `scrolled` adds a backdrop once the page
 * moves; `hidden` tucks the header away while scrolling down and brings it back
 * on any upward scroll. Never hides with reduced motion or an open menu.
 */
export function useHeaderVisibility(menuOpen: boolean) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      if (!reduced.matches && !menuOpen && Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 240);
      }
      if (menuOpen) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [menuOpen]);

  // Keyboard users must always see where focus is: show the header when it receives focus.
  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('header')) setHidden(false);
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  return { scrolled, hidden };
}
