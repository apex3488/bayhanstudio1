import { useRef, type PointerEvent } from 'react';
import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { serviceRouteId } from '../app/routeIds';
import { ArrowIcon } from '../components/ArrowIcon';
import { Label } from '../components/Label';
import { ServiceVisual } from '../components/ServiceVisual';
import { serviceIds } from '../content/services';
import { gsap, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import { useReveal } from '../motion/useReveal';
import styles from './ServicesShowcase.module.css';

/** Spotlight that follows the cursor across a panel (CSS variables, no re-render). */
function trackSpotlight(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

/**
 * Five directions as five "halls". On large screens with full motion the
 * section pins and the halls travel horizontally; otherwise it is a plain grid.
 */
export function ServicesShowcase() {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${media.motion} and ${media.desktopPin}`, () => {
        const section = root.current;
        const list = track.current;
        const frame = viewport.current;
        if (!section || !list || !frame) return;

        section.dataset.pinned = '';
        const distance = () => Math.max(0, list.scrollWidth - frame.clientWidth);
        const tween = gsap.to(list, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        // Keyboard users: bring a focused panel into view by scrolling the page.
        const onFocus = (event: FocusEvent) => {
          const panel = (event.target as Element).closest<HTMLElement>('[data-panel]');
          const trigger = tween.scrollTrigger;
          if (!panel || !trigger) return;
          const offset = Math.min(distance(), Math.max(0, panel.offsetLeft - list.offsetLeft));
          window.scrollTo({ top: trigger.start + offset, behavior: 'instant' });
        };
        list.addEventListener('focusin', onFocus);

        return () => {
          list.removeEventListener('focusin', onFocus);
          delete section.dataset.pinned;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.section} aria-labelledby="services-heading">
      <div className={`shell grid ${styles.head}`}>
        <div className={styles.headLabel} data-reveal>
          <Label index="02">{t.services.label}</Label>
        </div>
        <h2 id="services-heading" className={styles.title} data-reveal="1">
          {t.services.title}
        </h2>
        <p className={styles.intro} data-reveal="2">
          {t.services.intro}
        </p>
      </div>

      <div ref={viewport} className={styles.viewport}>
        <ol ref={track} className={`shell ${styles.track}`}>
          {serviceIds.map((id, index) => {
            const copy = t.services.items[id];
            return (
              <li key={id} className={styles.panel} data-panel onPointerMove={trackSpotlight}>
                <p className={styles.index} aria-hidden="true">
                  0{index + 1} <span>/ 0{serviceIds.length}</span>
                </p>
                <ServiceVisual id={id} className={styles.visual} />
                <h3 className={styles.name}>{copy.name}</h3>
                <p className={styles.short}>{copy.short}</p>
                <p className={styles.value}>{copy.value}</p>
                <a className={styles.more} href={href(serviceRouteId(id), locale)}>
                  {t.services.more}
                  <span className="visually-hidden">: {copy.name}</span>
                  <ArrowIcon />
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
