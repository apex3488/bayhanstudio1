import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { ButtonLink } from '../components/ButtonLink';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { introFinished, motionAllowed, settleHero } from '../motion/intro';
import { duration, ease, stagger } from '../motion/tokens';
import styles from './Hero.module.css';

/**
 * Digital awakening: the copy sits on the left third, the 3D head (fixed layer
 * behind) owns the rest of the frame. Corner annotations frame the shot like a
 * camera viewfinder.
 */
export function Hero() {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const title = el?.querySelector<HTMLElement>('[data-hero-title]');
      const items = gsap.utils.toArray<HTMLElement>('[data-hero-item]', el);
      const frame = gsap.utils.toArray<HTMLElement>('[data-hero-frame]', el);
      if (!el || !title || !motionAllowed()) {
        settleHero();
        return;
      }

      // Kinetic headline: words rise out of line masks. SplitText keeps an
      // aria-label on the heading, so screen readers still hear one sentence.
      const split = SplitText.create(title, { type: 'lines,words', mask: 'lines' });
      gsap.set(split.words, { yPercent: 115, rotate: 4 });
      gsap.set(title, { autoAlpha: 1 });
      gsap.set(items, { autoAlpha: 0, y: 26 });
      gsap.set(frame, { autoAlpha: 0 });

      let timeline: gsap.core.Timeline | undefined;
      let guard: ReturnType<typeof setTimeout> | undefined;
      let cancelled = false;
      void introFinished.then(() => {
        if (cancelled) return;
        // If animation frames are withheld, still reveal the headline and CTAs.
        guard = setTimeout(() => timeline?.progress(1), 4500);
        timeline = gsap
          .timeline({
            onComplete: () => {
              split.revert();
              settleHero();
            },
          })
          .to(split.words, {
            yPercent: 0,
            rotate: 0,
            duration: duration.hero * 1.15,
            ease: ease.out,
            stagger: stagger.words,
          })
          .to(
            items,
            {
              autoAlpha: 1,
              y: 0,
              duration: duration.reveal,
              ease: ease.out,
              stagger: stagger.blocks,
            },
            0.5,
          )
          .to(frame, { autoAlpha: 1, duration: 1.2, ease: ease.soft, stagger: 0.08 }, 0.8);
      });

      // Copy drifts up and fades as the camera starts its dive.
      const drift = gsap.to(el.querySelector('[data-hero-copy]'), {
        yPercent: -18,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 20%', scrub: true },
      });

      return () => {
        cancelled = true;
        clearTimeout(guard);
        timeline?.kill();
        drift.scrollTrigger?.kill();
        drift.kill();
        split.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title" data-scene="hero">
      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy} data-hero-copy>
          <p className={styles.eyebrow} data-hero-item>
            <span className={styles.brand}>BAYHAN STUDIO</span>
            <span className={styles.dash} aria-hidden="true" />
            {t.hero.eyebrow}
          </p>
          <h1 id="hero-title" className={styles.title} data-hero-title>
            {t.hero.title}
          </h1>
          <p className={styles.subtitle} data-hero-item>
            {t.hero.subtitle}
          </p>
          <div className={styles.actions} data-hero-item>
            <ButtonLink href={href('contact', locale)} size="l" magnetic>
              {t.hero.ctaPrimary}
            </ButtonLink>
            <a className={styles.workLink} href="#work">
              <span>{t.hero.ctaWork}</span>
              <span className={styles.workLine} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ul className={styles.meta} aria-hidden="true">
          {t.hero.meta.map((item, i) => (
            <li key={item} data-hero-frame className={styles[`meta${i}` as 'meta0']}>
              {item}
            </li>
          ))}
        </ul>

        <p className={styles.scroll} aria-hidden="true" data-hero-frame>
          <span className={styles.scrollTrack}>
            <span className={styles.scrollDot} />
          </span>
          {t.hero.scrollHint}
        </p>
      </div>
    </section>
  );
}
