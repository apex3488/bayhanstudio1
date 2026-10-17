import { lazy, Suspense, useEffect, useState } from 'react';
import { assetUrl } from '../../app/paths';
import { heroSettled } from '../../motion/intro';
import { canRender3D, REDUCED_MOTION_QUERY } from './capability';
import { RobotErrorBoundary } from './RobotErrorBoundary';
import styles from './RobotStage.module.css';

const RobotCanvas = lazy(() => import('./RobotCanvas'));

export const POSTER_PATH = 'robot/poster.webp';
export const POSTER_SIZE = 1200;

/**
 * Server-rendered poster first; the 3D scene is requested only after the page
 * has loaded and the browser is idle, and only on capable devices.
 * The canvas fades in over the poster once it has drawn its first frames.
 */
export function RobotStage({ className }: { className?: string }) {
  const [use3D, setUse3D] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const start = () => {
      if (canRender3D()) setUse3D(true);
    };
    const schedule = () => {
      // Safari has no requestIdleCallback.
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(start, { timeout: 2000 });
      } else {
        timeoutId = setTimeout(start, 300);
      }
    };

    // After the page load AND the hero reveal: shader compilation must never
    // freeze the first animation.
    let cancelled = false;
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });
    void Promise.all([loaded, heroSettled]).then(() => {
      if (!cancelled) schedule();
    });

    // Reduced motion can be switched on while the page is open.
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onMotionChange = () => {
      if (!motionQuery.matches) return;
      setReady(false);
      setUse3D(false);
    };
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      cancelled = true;
      motionQuery.removeEventListener('change', onMotionChange);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  function disable() {
    setReady(false);
    setUse3D(false);
  }

  return (
    <div className={`${styles.stage} ${className ?? ''}`} aria-hidden="true">
      <img
        className={styles.poster}
        data-hidden={ready || undefined}
        src={assetUrl(POSTER_PATH)}
        width={POSTER_SIZE}
        height={POSTER_SIZE}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {use3D && (
        <RobotErrorBoundary onError={disable}>
          <Suspense fallback={null}>
            <RobotCanvas
              className={styles.canvas}
              visible={ready}
              onReady={() => setReady(true)}
              onContextLost={disable}
            />
          </Suspense>
        </RobotErrorBoundary>
      )}
    </div>
  );
}
