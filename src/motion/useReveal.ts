import type { RefObject } from 'react';
import { gsap, useGSAP } from './gsap';
import { duration, ease, media, stagger } from './tokens';

/**
 * Fades and lifts every `[data-reveal]` element inside `scope` once, when it
 * scrolls into view. Elements stay fully visible with reduced motion or no JS.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current);
        if (items.length === 0) return;
        gsap.set(items, { autoAlpha: 0, y: 28 });
        gsap.utils.toArray<HTMLElement>(items).forEach((item) => {
          gsap.to(item, {
            autoAlpha: 1,
            y: 0,
            duration: duration.reveal,
            ease: ease.out,
            delay: Number(item.dataset.reveal || 0) * stagger.blocks,
            scrollTrigger: { trigger: item, start: 'top 88%', once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
}
