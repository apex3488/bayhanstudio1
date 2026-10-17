import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { Label } from '../components/Label';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import styles from './Manifesto.module.css';

/**
 * Philosophy, staged inside the camera's dive: the frame holds still while the
 * statement lights up word by word and a giant line of type travels behind it.
 */
export function Manifesto() {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  const band = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        if (!text.current || !root.current) return;
        const split = SplitText.create(text.current, { type: 'words' });
        gsap.fromTo(
          split.words,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              trigger: root.current,
              start: 'top 20%',
              end: 'bottom 85%',
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          band.current,
          { xPercent: 8 },
          {
            xPercent: -42,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className={styles.section}
      aria-labelledby="manifesto-heading"
      data-scene="manifesto"
    >
      <div className={styles.frame}>
        <p ref={band} className={styles.band} aria-hidden="true">
          Future technology — Future technology —
        </p>
        <div className={`shell ${styles.content}`}>
          <h2 id="manifesto-heading" className={styles.heading}>
            <Label as="span" index="01" tone="accent">
              {t.manifesto.label}
            </Label>
          </h2>
          <p ref={text} className={styles.text}>
            {t.manifesto.text}
          </p>
        </div>
      </div>
    </section>
  );
}
