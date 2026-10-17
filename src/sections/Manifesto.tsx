import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { Label } from '../components/Label';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import styles from './Manifesto.module.css';

/** One statement, lit word by word as it scrolls through the viewport. */
export function Manifesto() {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        if (!text.current) return;
        const split = SplitText.create(text.current, { type: 'words' });
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              trigger: text.current,
              start: 'top 78%',
              end: 'bottom 55%',
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
    <section ref={root} className={`shell ${styles.section}`} aria-labelledby="manifesto-heading">
      <h2 id="manifesto-heading" className={styles.heading}>
        <Label as="span" index="01">
          {t.manifesto.label}
        </Label>
      </h2>
      <p ref={text} className={styles.text}>
        {t.manifesto.text}
      </p>
    </section>
  );
}
