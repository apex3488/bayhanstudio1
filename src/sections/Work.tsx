import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { assetUrl } from '../app/paths';
import { Label } from '../components/Label';
import { WorkVisual, type WorkVisualId } from '../components/WorkVisual';
import { MACRO, MACRO_SIZE } from '../content/media';
import { gsap, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import { useReveal } from '../motion/useReveal';
import styles from './Work.module.css';

interface Visual {
  id: WorkVisualId;
  image: string;
}

const VISUALS: [Visual, ...Visual[]] = [
  { id: 'bayhan', image: 'media/poster-wide.webp' },
  { id: 'orbit', image: MACRO.temple },
  { id: 'atelier', image: MACRO.crown },
];

/**
 * Selected work as editorial frames. Each frame opens from a mask as it enters and
 * its image drifts against the scroll. Every item states plainly what it is:
 * the studio's own project or a concept study — never a client case it is not.
 */
export function Work() {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        gsap.utils.toArray<HTMLElement>('[data-work-frame]', root.current).forEach((frame) => {
          gsap.fromTo(
            frame,
            { clipPath: 'inset(14% 10% 14% 10% round 4px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 4px)',
              ease: 'none',
              scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 35%', scrub: true },
            },
          );
          gsap.fromTo(
            frame.querySelector('img'),
            { yPercent: -8, scale: 1.14 },
            {
              yPercent: 8,
              scale: 1.04,
              ease: 'none',
              scrollTrigger: {
                trigger: frame,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      className={`surface ${styles.section}`}
      aria-labelledby="work-heading"
      tabIndex={-1}
    >
      <div className={`shell grid ${styles.head}`}>
        <div className={styles.label} data-reveal>
          <Label index="03" tone="accent">
            {t.work.label}
          </Label>
        </div>
        <h2 id="work-heading" className={styles.title} data-reveal="1">
          {t.work.title}
        </h2>
        <p className={styles.intro} data-reveal="2">
          {t.work.intro}
        </p>
      </div>

      <ol className={`shell ${styles.list}`}>
        {t.work.items.map((item, index) => {
          const visual = VISUALS[index] ?? VISUALS[0];
          return (
            <li key={item.title} className={styles.item} data-side={index % 2 ? 'right' : 'left'}>
              <figure className={styles.figure}>
                <div className={styles.frame} data-work-frame>
                  <img
                    src={assetUrl(visual.image)}
                    alt=""
                    width={MACRO_SIZE.width}
                    height={MACRO_SIZE.height}
                    loading="lazy"
                    decoding="async"
                  />
                  <WorkVisual id={visual.id} />
                </div>
                <figcaption className={styles.caption}>
                  <span className={styles.kind} data-reveal>
                    {item.kind}
                  </span>
                  <h3 className={styles.name} data-reveal="1">
                    <span className={styles.number} aria-hidden="true">
                      0{index + 1}
                    </span>
                    {item.title}
                  </h3>
                  <p className={styles.summary} data-reveal="2">
                    {item.summary}
                  </p>
                  <p className={styles.tags} data-reveal="3">
                    {item.tags}
                  </p>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
