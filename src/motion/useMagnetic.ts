import type { RefObject } from 'react';
import { gsap, useGSAP } from './gsap';
import { media } from './tokens';

/**
 * Pulls an element gently toward the cursor. Only for precise pointers with
 * full motion; touch, keyboard and reduced-motion users get a static element.
 */
export function useMagnetic(
  target: RefObject<HTMLElement | null>,
  enabled = true,
  strength = 0.28,
) {
  useGSAP(
    () => {
      const el = target.current;
      if (!enabled || !el) return;
      const mm = gsap.matchMedia();
      mm.add(`${media.motion} and ${media.finePointer}`, () => {
        const toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          toX((event.clientX - rect.left - rect.width / 2) * strength);
          toY((event.clientY - rect.top - rect.height / 2) * strength);
        };
        const onLeave = () => {
          toX(0);
          toY(0);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);
        return () => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerleave', onLeave);
          gsap.set(el, { x: 0, y: 0 });
        };
      });
      return () => mm.revert();
    },
    { dependencies: [enabled, strength] },
  );
}
