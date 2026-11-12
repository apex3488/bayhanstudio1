"use client";

import { useEffect, useRef } from "react";

const pad = (n: number, l = 2) => String(n).padStart(l, "0");

/**
 * Instrument layer: scroll gauge, pointer coordinates and local time.
 * Purely decorative and language-neutral, so it is hidden from assistive tech.
 */
export default function Hud() {
  const fill = useRef<HTMLElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const xy = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    let px = 0;
    let py = 0;
    let dirty = true;

    const onMove = (e: PointerEvent) => {
      px = Math.round(e.clientX);
      py = Math.round(e.clientY);
      dirty = true;
      if (e.pointerType === "mouse" && spot.current) {
        spot.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        spot.current.classList.add("is-on");
      }
    };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const v = Math.round(p * 100);
      if (v !== last) {
        last = v;
        if (fill.current) fill.current.style.transform = `scaleY(${p})`;
        if (pct.current) pct.current.textContent = pad(v, 3);
      }
      if (dirty && xy.current) {
        dirty = false;
        xy.current.textContent = `X ${pad(px, 4)} · Y ${pad(py, 4)}`;
      }
    };
    const tick = () => {
      const d = new Date();
      if (clock.current) clock.current.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <div ref={spot} className="spot" aria-hidden="true" />
      <div className="hud" aria-hidden="true">
      <div className="hud__gauge">
        <span ref={pct} className="hud__pct">
          000
        </span>
        <span className="hud__track">
          <i ref={fill} />
        </span>
      </div>
      <div className="hud__readout">
        <span ref={xy}>X 0000 · Y 0000</span>
        <span ref={clock}>00:00:00</span>
      </div>
      </div>
    </>
  );
}
