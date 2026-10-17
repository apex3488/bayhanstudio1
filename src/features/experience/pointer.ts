/**
 * Viewport-normalised pointer shared with the render loop (no React state, no re-renders).
 * Only precise pointers (mouse, pen) steer the head; touch devices get the idle scan.
 */
const IDLE_AFTER_S = 4;

let lastMove = -Infinity;
let clockOffset: number | null = null;

export const pointer = {
  x: 0,
  y: 0,
  /** true when the head should run its autonomous scan instead of following */
  idle(elapsed: number): boolean {
    if (clockOffset === null) return true;
    return elapsed - (lastMove - clockOffset) > IDLE_AFTER_S;
  },
};

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  lastMove = performance.now() / 1000;
}

/** Starts tracking; returns the cleanup. `elapsed` aligns timestamps with the R3F clock. */
export function trackPointer(clockElapsed: () => number): () => void {
  clockOffset = performance.now() / 1000 - clockElapsed();
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    clockOffset = null;
    lastMove = -Infinity;
  };
}
