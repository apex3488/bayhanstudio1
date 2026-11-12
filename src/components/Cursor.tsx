"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { motionEnabled } from "@/lib/motion";

const INTERACTIVE = "a, button, [data-cursor], input, textarea, select, summary, label[for]";

/**
 * Desktop-only follower ring + magnetic pull for [data-magnetic] elements.
 * The native cursor stays visible: the ring is an accent, not a replacement.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el || !motionEnabled()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    let shown = false;
    let magnet: HTMLElement | null = null;

    const release = () => {
      if (!magnet) return;
      gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
      magnet = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        el.classList.add("is-visible");
      }
      x(e.clientX);
      y(e.clientY);

      const target = e.target as Element | null;
      el.classList.toggle("is-active", !!target?.closest?.(INTERACTIVE));
      const labelled = target?.closest?.<HTMLElement>("[data-cursor-label]") ?? null;
      const text = labelled?.dataset.cursorLabel ?? "";
      if (el.dataset.label !== text) el.dataset.label = text;
      el.classList.toggle("has-label", !!text);

      const m = target?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (m !== magnet) release();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        gsap.to(m, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.28,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };
    const onLeave = () => {
      shown = false;
      el.classList.remove("is-visible");
      release();
    };
    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      release();
    };
  }, []);

  return <div ref={ring} className="cursor" aria-hidden="true" data-label="" />;
}
