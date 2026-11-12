"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

type Props = {
  children: ReactNode;
  count: number;
  labels: { prev: string; next: string; region: string };
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Project carousel. Native horizontal scrolling underneath (touch, trackpad,
 * shift+wheel all work), plus on desktop: grab-and-drag with inertia, snapping,
 * arrow buttons and keyboard. A drag never triggers the link under the pointer.
 */
export default function Rail({ children, count, labels }: Props) {
  const view = useRef<HTMLDivElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);
  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const api = useRef<{ go: (dir: number) => void }>({ go: () => {} });

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const slides = Array.from(el.querySelectorAll<HTMLElement>(".slide"));
    if (!slides.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let tween: gsap.core.Tween | null = null;
    let raf = 0;

    const centerOf = (s: HTMLElement) => s.offsetLeft + s.offsetWidth / 2;
    const targetFor = (i: number) => {
      const max = el.scrollWidth - el.clientWidth;
      return Math.max(0, Math.min(max, centerOf(slides[i]) - el.clientWidth / 2));
    };
    const nearest = (left: number) => {
      const mid = left + el.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(centerOf(s) - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      return best;
    };

    // Per-slide position (-1..1 around the centre) drives depth and parallax in CSS.
    const paint = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      for (const s of slides) {
        const p = Math.max(-1.4, Math.min(1.4, (centerOf(s) - mid) / el.clientWidth));
        s.style.setProperty("--p", p.toFixed(3));
        s.style.setProperty("--a", Math.min(1, Math.abs(p)).toFixed(3));
      }
      const max = el.scrollWidth - el.clientWidth;
      const progress = max > 0 ? el.scrollLeft / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.04, progress)})`;
      current = nearest(el.scrollLeft);
      if (index.current) index.current.textContent = pad(Math.min(current + 1, count));
      if (prev.current) prev.current.disabled = el.scrollLeft <= 2;
      if (next.current) next.current.disabled = el.scrollLeft >= max - 2;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const scrollToIndex = (i: number, duration = 0.9) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, i));
      tween?.kill();
      if (reduced) {
        el.scrollLeft = targetFor(clamped);
        return;
      }
      tween = gsap.to(el, { scrollLeft: targetFor(clamped), duration, ease: "power3.out", overwrite: true });
    };
    api.current.go = (dir) => scrollToIndex(nearest(el.scrollLeft) + dir);

    /* ---- drag with the mouse ---- */
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = lastX = e.clientX;
      startLeft = el.scrollLeft;
      lastT = performance.now();
      velocity = 0;
      tween?.kill();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5 && !el.classList.contains("is-dragging")) {
        el.classList.add("is-dragging");
        el.setPointerCapture(e.pointerId);
      }
      if (moved <= 5) return;
      el.scrollLeft = startLeft - dx;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = velocity * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
      lastX = e.clientX;
      lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (!el.classList.contains("is-dragging")) return;
      el.classList.remove("is-dragging");
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // throw: project the release velocity, then settle on the nearest slide
      // a flick carries at most one slide further than where the hand let go
      const v = Math.max(-2.2, Math.min(2.2, velocity));
      const from = nearest(el.scrollLeft);
      const aimed = nearest(el.scrollLeft - v * 240);
      scrollToIndex(Math.max(from - 1, Math.min(from + 1, aimed)), 1.1);
    };
    // a drag must not open the project under the pointer
    const onClick = (e: MouseEvent) => {
      if (moved > 5) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        api.current.go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        api.current.go(-1);
      }
    };
    const onDragStart = (e: Event) => e.preventDefault();

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("keydown", onKey);
    el.addEventListener("dragstart", onDragStart);
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    paint();

    return () => {
      tween?.kill();
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [count]);

  return (
    <div className="rail">
      <div ref={view} className="rail__view" tabIndex={0} role="region" aria-label={labels.region}>
        <ul className="rail__track">{children}</ul>
      </div>
      <div className="rail__controls">
        <p className="rail__counter" aria-hidden="true">
          <span ref={index}>01</span>
          <i>/ {pad(count)}</i>
        </p>
        <div className="rail__bar" aria-hidden="true">
          <i ref={bar} />
        </div>
        <div className="rail__buttons">
          <button ref={prev} type="button" className="rail__btn" aria-label={labels.prev} onClick={() => api.current.go(-1)} data-magnetic>
            <span aria-hidden="true">←</span>
          </button>
          <button ref={next} type="button" className="rail__btn" aria-label={labels.next} onClick={() => api.current.go(1)} data-magnetic>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
