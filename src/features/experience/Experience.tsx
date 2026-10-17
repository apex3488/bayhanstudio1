import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../app/paths';
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap';
import { heroSettled } from '../../motion/intro';
import { media } from '../../motion/tokens';
import { sound } from '../sound/engine';
import { canRender3D, REDUCED_MOTION_QUERY, renderTier } from './capability';
import styles from './Experience.module.css';
import { POSTERS } from './posters';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { loadSceneChunk, sceneState } from './sceneState';

const ExperienceCanvas = lazy(loadSceneChunk);

/** Portrait or narrow screens: the head sits above the headline instead of beside it. */
const COMPACT_QUERY = '(max-width: 900px), (max-aspect-ratio: 1/1)';

/**
 * The single 3D scene of the home page, fixed behind the content.
 * Scroll drives it: hero framing → dive into the visor through the manifesto →
 * fades out over the middle of the page → returns for the contact finale.
 * Server-rendered as a poster; the canvas replaces it only on capable devices.
 */
export function Experience() {
  const layer = useRef<HTMLDivElement>(null);
  const [use3D, setUse3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [compact, setCompact] = useState(false);
  const [tier, setTier] = useState<'high' | 'low'>('high');

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const update = () => {
      sceneState.compact = query.matches;
      setCompact(query.matches);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // When to start the heavy chunk: immediately behind the first-visit preloader
  // (which waits for it), otherwise only after the hero reveal so it never stutters.
  useEffect(() => {
    if (!canRender3D()) return;
    let cancelled = false;
    let idle: number | undefined;
    const start = () => {
      if (cancelled) return;
      setTier(renderTier());
      setUse3D(true);
    };
    if (document.documentElement.classList.contains('preloading')) start();
    else
      void heroSettled.then(() => {
        if (typeof window.requestIdleCallback === 'function') {
          idle = window.requestIdleCallback(start, { timeout: 1500 });
        } else start();
      });

    const motion = window.matchMedia(REDUCED_MOTION_QUERY);
    const onMotion = () => {
      if (!motion.matches) return;
      setReady(false);
      setUse3D(false);
    };
    motion.addEventListener('change', onMotion);
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      motion.removeEventListener('change', onMotion);
    };
  }, []);

  useGSAP(() => {
    const el = layer.current;
    const hero = document.querySelector('[data-scene="hero"]');
    const manifesto = document.querySelector('[data-scene="manifesto"]');
    const finale = document.querySelector('[data-scene="finale"]');
    if (!el || !hero || !manifesto || !finale) return;

    const mm = gsap.matchMedia();
    mm.add(media.motion, () => {
      let heroPresence = 1;
      let finalePresence = 0;
      const apply = () => {
        const opacity = Math.max(heroPresence, finalePresence);
        el.style.opacity = opacity.toFixed(3);
        el.style.setProperty('--dive', sceneState.dive.toFixed(3));
        const on = opacity > 0.01;
        setActive((current) => (current === on ? current : on));
      };

      const triggers = [
        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          endTrigger: manifesto,
          end: 'bottom bottom',
          onUpdate: (self) => {
            sceneState.dive = self.progress;
            apply();
          },
        }),
        ScrollTrigger.create({
          trigger: manifesto,
          start: 'bottom bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            heroPresence = 1 - self.progress;
            apply();
          },
        }),
        ScrollTrigger.create({
          trigger: finale,
          start: 'top bottom',
          end: 'top 20%',
          onUpdate: (self) => {
            sceneState.finale = self.progress;
            finalePresence = self.progress;
            apply();
          },
          onEnter: () => sound.play('transition'),
        }),
        ScrollTrigger.create({
          trigger: manifesto,
          start: 'top 60%',
          onEnter: () => sound.play('transition'),
        }),
      ];
      apply();

      return () => {
        triggers.forEach((trigger) => trigger.kill());
        sceneState.dive = 0;
        sceneState.finale = 0;
        el.style.opacity = '';
      };
    });
    return () => mm.revert();
  });

  return (
    <div ref={layer} className={styles.layer} data-experience aria-hidden="true">
      <picture className={styles.poster} data-hidden={ready || undefined}>
        <source media={COMPACT_QUERY} srcSet={assetUrl(POSTERS.tall.path)} />
        <img
          src={assetUrl(POSTERS.wide.path)}
          width={POSTERS.wide.width}
          height={POSTERS.wide.height}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      {use3D && (
        <SceneErrorBoundary
          onError={() => {
            setReady(false);
            setUse3D(false);
          }}
        >
          <Suspense fallback={null}>
            <ExperienceCanvas
              className={styles.canvas}
              active={active}
              tier={tier}
              compact={compact}
              onReady={() => setReady(true)}
              onContextLost={() => {
                setReady(false);
                setUse3D(false);
              }}
            />
          </Suspense>
        </SceneErrorBoundary>
      )}
      <div className={styles.shade} />
    </div>
  );
}
