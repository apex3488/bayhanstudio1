import { useRef, useState, type CSSProperties } from 'react';
import { usePage } from '../app/PageContext';
import { Label } from '../components/Label';
import { gsap, ScrollTrigger, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import { useReveal } from '../motion/useReveal';
import styles from './Process.module.css';

/**
 * From idea to reality as a spatial sequence: on large screens the frame pins,
 * a giant numeral counts through the five stages and the active stage lights up
 * as the reader scrolls. Elsewhere it is a plain ordered list.
 */
export function Process({ index = '04' }: { index?: string }) {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const steps = t.process.steps;
  useReveal(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${media.motion} and ${media.desktopPin}`, () => {
        const el = track.current;
        if (!el) return;
        el.dataset.pinned = '';
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            el.style.setProperty('--progress', self.progress.toFixed(4));
            setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
          },
        });
        return () => {
          trigger.kill();
          delete el.dataset.pinned;
          setActive(0);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [steps.length] },
  );

  return (
    <section ref={root} className={`surface ${styles.section}`} aria-labelledby="process-heading">
      <div
        ref={track}
        className={styles.track}
        style={{ '--steps': steps.length } as CSSProperties}
      >
        <div className={`shell grid ${styles.frame}`}>
          <div className={styles.head}>
            <div data-reveal>
              <Label index={index} tone="accent">
                {t.process.label}
              </Label>
            </div>
            <h2 id="process-heading" className={styles.title} data-reveal="1">
              {t.process.title}
            </h2>
            <p className={styles.numeral} aria-hidden="true">
              <span key={active}>0{active + 1}</span>
            </p>
          </div>

          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={styles.step}
                data-reveal
                data-state={i === active ? 'active' : i < active ? 'done' : undefined}
              >
                <span className={styles.number} aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </ol>
          <span className={styles.progress} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
