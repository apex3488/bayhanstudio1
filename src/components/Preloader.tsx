import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { assetUrl } from '../app/paths';
import { canRender3D } from '../features/experience/capability';
import { POSTERS } from '../features/experience/posters';
import { loadSceneChunk, sceneReady } from '../features/experience/sceneState';
import { gsap, useGSAP } from '../motion/gsap';
import { finishIntro, markMotionReady } from '../motion/intro';
import styles from './Preloader.module.css';

/** Never hold the content longer than this, whatever is still loading. */
const MAX_WAIT_MS = 4200;
const MIN_VISIBLE_MS = 1100;

interface Task {
  weight: number;
  promise: Promise<unknown>;
}

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * First-visit intro with a real progress figure: it counts fonts, the poster and —
 * on capable devices — the 3D chunk and its first rendered frame. Its entrance is
 * CSS (plays before JavaScript); JS drives the number and lifts it away.
 */
export function Preloader() {
  const { t } = usePage();
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const html = document.documentElement;
    markMotionReady();
    const el = root.current;
    if (!html.classList.contains('preloading') || !el) {
      finishIntro();
      return;
    }

    const compact = window.matchMedia('(max-width: 900px), (max-aspect-ratio: 1/1)').matches;
    const hasScene = Boolean(document.querySelector('[data-experience]'));
    const tasks: Task[] = [
      { weight: 25, promise: document.fonts.ready },
      ...(hasScene
        ? [
            {
              weight: 20,
              promise: loadImage(assetUrl((compact ? POSTERS.tall : POSTERS.wide).path)),
            },
          ]
        : []),
      ...(hasScene && canRender3D()
        ? [
            { weight: 25, promise: loadSceneChunk() },
            { weight: 30, promise: sceneReady },
          ]
        : []),
    ];
    const total = tasks.reduce((sum, task) => sum + task.weight, 0);

    const shown = { value: 0 };
    let done = 0;
    const render = () => {
      const value = Math.round(shown.value);
      if (counter.current) counter.current.textContent = String(value).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${shown.value / 100})`;
    };
    const advance = (weight: number) => {
      done += weight;
      gsap.to(shown, {
        value: (done / total) * 100,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: render,
      });
    };
    tasks.forEach(
      (task) =>
        void task.promise.then(
          () => advance(task.weight),
          () => advance(task.weight),
        ),
    );

    let cancelled = false;
    let guard: ReturnType<typeof setTimeout> | undefined;
    const all = Promise.all(tasks.map((task) => task.promise.catch(() => undefined)));
    const capped = Promise.race([all, new Promise((r) => setTimeout(r, MAX_WAIT_MS))]);
    const minimum = new Promise((r) =>
      setTimeout(r, Math.max(0, MIN_VISIBLE_MS - performance.now())),
    );

    void Promise.all([capped, minimum]).then(() => {
      if (cancelled) return;
      gsap.to(shown, { value: 100, duration: 0.35, ease: 'power2.out', onUpdate: render });
      const exit = gsap
        .timeline({ delay: 0.35, onComplete: () => html.classList.remove('preloading') })
        .to(el.querySelector('[data-pre-content]'), {
          yPercent: -30,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.in',
        })
        .add(finishIntro, '-=0.1')
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.15');
      // Animation frames can be withheld (background tabs, some in-app webviews):
      // timers still run, so the overlay can never outlive its exit.
      guard = setTimeout(() => {
        finishIntro();
        exit.progress(1);
      }, 2200);
    });

    return () => {
      cancelled = true;
      clearTimeout(guard);
    };
  });

  return (
    <div ref={root} className={styles.preloader} aria-hidden="true">
      <div className={styles.content} data-pre-content>
        <p className={styles.brand}>
          <span className={styles.word}>BAYHAN</span>
          <span className={styles.studio}>STUDIO</span>
        </p>
        <div className={styles.footer}>
          <span className={styles.label}>{t.experience.loading}</span>
          <span ref={counter} className={styles.counter}>
            000
          </span>
        </div>
        <span className={styles.track}>
          <span ref={bar} className={styles.bar} />
        </span>
      </div>
    </div>
  );
}
