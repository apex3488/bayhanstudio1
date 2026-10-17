import { useEffect, useRef, useState } from 'react';
import { usePage } from '../app/PageContext';
import { assetUrl, href } from '../app/paths';
import { serviceRouteId } from '../app/routeIds';
import { ArrowIcon } from '../components/ArrowIcon';
import { Label } from '../components/Label';
import { ServiceVisual } from '../components/ServiceVisual';
import { MACRO_SIZE, serviceMedia } from '../content/media';
import { serviceIds } from '../content/services';
import { sound } from '../features/sound/engine';
import { gsap, ScrollTrigger, useGSAP } from '../motion/gsap';
import { useReveal } from '../motion/useReveal';
import styles from './ServicesIndex.module.css';

/**
 * Digital capabilities as an editorial index: oversized names on the left, one
 * cinematic frame on the right that cuts between shots of the sculpture as each
 * direction comes into focus (scroll, hover or keyboard focus).
 */
export function ServicesIndex() {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  // Shots sit inside clip-path masks, which native lazy-loading treats as invisible:
  // load them ourselves once the section is about a screen away.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '1000px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useReveal(root);

  const select = (index: number) => {
    if (index === active) return;
    sound.play('hover');
    setActive(index);
  };

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-service-row]', root.current);
      const triggers = rows.map((row, index) =>
        ScrollTrigger.create({
          trigger: row,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (self.isActive) setActive(index);
          },
        }),
      );
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { scope: root },
  );

  return (
    <section ref={root} className={`surface ${styles.section}`} aria-labelledby="services-heading">
      <div className={`shell grid ${styles.head}`}>
        <div className={styles.label} data-reveal>
          <Label index="02" tone="accent">
            {t.services.label}
          </Label>
        </div>
        <h2 id="services-heading" className={styles.title} data-reveal="1">
          {t.services.title}
        </h2>
        <p className={styles.intro} data-reveal="2">
          {t.services.intro}
        </p>
      </div>

      <div className={`shell grid ${styles.body}`}>
        <ol className={styles.list}>
          {serviceIds.map((id, index) => {
            const copy = t.services.items[id];
            return (
              <li key={id} data-service-row data-active={active === index || undefined}>
                <a
                  className={styles.row}
                  href={href(serviceRouteId(id), locale)}
                  onPointerEnter={() => select(index)}
                  onFocus={() => select(index)}
                >
                  <span className={styles.index} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className={styles.name}>{copy.name}</span>
                  <span className={styles.short}>{copy.short}</span>
                  <span className={styles.more}>
                    {t.services.more}
                    <ArrowIcon />
                  </span>
                  {/* Compact layouts: each row carries its own frame */}
                  <span className={styles.inlineMedia} aria-hidden="true">
                    <img
                      src={assetUrl(serviceMedia[id])}
                      alt=""
                      width={MACRO_SIZE.width}
                      height={MACRO_SIZE.height}
                      loading="lazy"
                      decoding="async"
                    />
                    <ServiceVisual id={id} className={styles.motif} />
                  </span>
                </a>
              </li>
            );
          })}
        </ol>

        <div className={styles.stage} aria-hidden="true">
          <div className={styles.frame}>
            {serviceIds.map((id, index) => (
              <div key={id} className={styles.shot} data-active={active === index || undefined}>
                {near && (
                  <img
                    src={assetUrl(serviceMedia[id])}
                    alt=""
                    width={MACRO_SIZE.width}
                    height={MACRO_SIZE.height}
                    decoding="async"
                  />
                )}
                <ServiceVisual id={id} className={styles.motif} />
              </div>
            ))}
            <span className={styles.counter}>
              0{active + 1} <span>/ 0{serviceIds.length}</span>
            </span>
          </div>
          <p className={styles.caption}>
            {t.services.items[serviceIds[active] ?? 'websites'].value}
          </p>
        </div>
      </div>
    </section>
  );
}
