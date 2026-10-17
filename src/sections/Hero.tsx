import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { ButtonLink } from '../components/ButtonLink';
import { Label } from '../components/Label';
import { contacts } from '../content/contacts';
import { RobotStage } from '../features/robot/RobotStage';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { introFinished, motionAllowed, settleHero } from '../motion/intro';
import { duration, ease, media, stagger } from '../motion/tokens';
import styles from './Hero.module.css';

export function Hero() {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const title = el?.querySelector<HTMLElement>('[data-hero-title]');
      const items = gsap.utils.toArray<HTMLElement>('[data-hero-item]', el);
      const stage = el?.querySelector<HTMLElement>('[data-hero-stage]');
      if (!el || !title || !stage || !motionAllowed()) {
        settleHero();
        return;
      }

      // Kinetic headline: words rise out of line masks. SplitText keeps an
      // aria-label on the heading, so screen readers still get one sentence.
      const split = SplitText.create(title, { type: 'lines,words', mask: 'lines' });
      gsap.set(split.words, { yPercent: 110 });
      gsap.set(title, { autoAlpha: 1 });
      gsap.set(items, { autoAlpha: 0, y: 24 });
      gsap.set(stage, { autoAlpha: 0 });

      let timeline: gsap.core.Timeline | undefined;
      let guard: ReturnType<typeof setTimeout> | undefined;
      let cancelled = false;
      void introFinished.then(() => {
        if (cancelled) return;
        // If animation frames are withheld, still reveal the headline and CTAs.
        guard = setTimeout(() => timeline?.progress(1), 4000);
        timeline = gsap
          .timeline({
            onComplete: () => {
              split.revert();
              settleHero();
            },
          })
          .to(split.words, {
            yPercent: 0,
            duration: duration.hero,
            ease: ease.out,
            stagger: stagger.words,
          })
          .to(stage, { autoAlpha: 1, duration: 1.6, ease: ease.soft }, 0.15)
          .to(
            items,
            {
              autoAlpha: 1,
              y: 0,
              duration: duration.reveal,
              ease: ease.out,
              stagger: stagger.blocks,
            },
            0.45,
          );
      });

      // As the hero scrolls away, the sculpture recedes into the dark.
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        gsap.to(stage, {
          yPercent: -8,
          scale: 0.92,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        });
      });

      return () => {
        cancelled = true;
        clearTimeout(guard);
        timeline?.kill();
        split.revert();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className={`shell grid ${styles.hero}`} aria-labelledby="hero-title">
      <div className={styles.stageWrap} data-hero-stage>
        <RobotStage />
      </div>

      <div className={styles.copy}>
        <div data-hero-item>
          <Label tone="accent">{t.hero.eyebrow}</Label>
        </div>
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
          <ButtonLink href={contacts.telegram} size="l" variant="secondary" external>
            {t.hero.ctaTelegram}
          </ButtonLink>
        </div>
      </div>

      <p className={styles.scrollHint} aria-hidden="true" data-hero-item>
        <span className={styles.scrollLine} />
        {t.hero.scrollHint}
      </p>
    </section>
  );
}
