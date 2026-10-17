import { useRef } from 'react';
import { finishIntro, markMotionReady } from '../motion/intro';
import { gsap, useGSAP } from '../motion/gsap';
import styles from './Preloader.module.css';

const MIN_VISIBLE_MS = 900;
const MAX_WAIT_MS = 1600;

/**
 * Brand intro shown once per session. Its entrance is pure CSS so it plays
 * before JavaScript arrives; JS only lifts it away. It never waits for 3D.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const html = document.documentElement;
    markMotionReady();
    if (!html.classList.contains('preloading') || !root.current) {
      finishIntro();
      return;
    }

    const elapsed = performance.now();
    const minDelay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const fonts = Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, MAX_WAIT_MS)),
    ]);

    let cancelled = false;
    let guard: ReturnType<typeof setTimeout> | undefined;
    void Promise.all([fonts, new Promise((r) => setTimeout(r, minDelay))]).then(() => {
      if (cancelled || !root.current) return;
      const exit = gsap.to(root.current, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.8,
        ease: 'expo.inOut',
        onStart: finishIntro,
        onComplete: () => html.classList.remove('preloading'),
      });
      // Animation frames can be withheld (background tabs, some in-app webviews):
      // timers still run, so never let the overlay outlive its exit.
      guard = setTimeout(() => {
        finishIntro();
        exit.progress(1);
      }, 1500);
    });
    return () => {
      cancelled = true;
      clearTimeout(guard);
    };
  });

  return (
    <div ref={root} className={styles.preloader} aria-hidden="true">
      <div className={styles.mark}>
        <span className={styles.word}>BAYHAN</span>
        <span className={styles.scan} />
      </div>
    </div>
  );
}
