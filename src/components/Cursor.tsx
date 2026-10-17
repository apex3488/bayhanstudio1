import { useRef } from 'react';
import { gsap, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import styles from './Cursor.module.css';

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label';

/**
 * Desktop-only cursor companion: a ring that trails the native pointer and opens
 * over interactive elements. The system cursor is never hidden, so focus, text
 * selection and OS accessibility cursors keep working. Disabled for touch,
 * coarse pointers and reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ring.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(`${media.motion} and ${media.finePointer}`, () => {
      const toX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const toY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      let shown = false;

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        if (!shown) {
          gsap.set(el, { x: event.clientX, y: event.clientY });
          el.dataset.visible = '';
          shown = true;
        }
        toX(event.clientX);
        toY(event.clientY);
      };
      const onOver = (event: PointerEvent) => {
        const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
        if (target) el.dataset.active = '';
        else delete el.dataset.active;
      };
      const onLeave = () => {
        delete el.dataset.visible;
        shown = false;
      };
      const onDown = () => (el.dataset.pressed = '');
      const onUp = () => delete el.dataset.pressed;

      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerover', onOver, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      return () => {
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        delete el.dataset.visible;
      };
    });
    return () => mm.revert();
  });

  return <div ref={ring} className={styles.ring} aria-hidden="true" />;
}
