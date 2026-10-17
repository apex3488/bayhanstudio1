import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { Label } from '../components/Label';
import { gsap, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import { useReveal } from '../motion/useReveal';
import styles from './Process.module.css';

/** Five steps on a vertical rail; the rail fills as the reader progresses. */
export function Process({ index = '03' }: { index?: string }) {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        if (!list.current) return;
        gsap.fromTo(
          list.current,
          { '--progress': 0 },
          {
            '--progress': 1,
            ease: 'none',
            scrollTrigger: {
              trigger: list.current,
              start: 'top 70%',
              end: 'bottom 60%',
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className={`shell grid ${styles.section}`}
      aria-labelledby="process-heading"
    >
      <div className={styles.head}>
        <div data-reveal>
          <Label index={index}>{t.process.label}</Label>
        </div>
        <h2 id="process-heading" className={styles.title} data-reveal="1">
          {t.process.title}
        </h2>
      </div>

      <ol ref={list} className={styles.steps}>
        {t.process.steps.map((step, i) => (
          <li key={step.title} className={styles.step} data-reveal>
            <span className={styles.number} aria-hidden="true">
              0{i + 1}
            </span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
