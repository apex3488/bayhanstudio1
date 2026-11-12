"use client";

import { useEffect } from "react";
import { setSceneState } from "./SceneCanvas";

/** Tells the column scene which service block is in the middle of the viewport. */
export default function ServiceSpy() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-service-index]"));
    const dots = Array.from(document.querySelectorAll<HTMLElement>("[data-service-dot]"));
    if (!blocks.length) return;
    let active = -1;
    const apply = (next: number) => {
      if (next === active) return;
      active = next;
      setSceneState("column", "active", next);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === next));
      blocks.forEach((b, i) => b.classList.toggle("is-active", i === next));
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.serviceIndex);
          if (e.isIntersecting) apply(i);
          else if (i === active) apply(-1);
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    blocks.forEach((b) => io.observe(b));
    return () => {
      io.disconnect();
      setSceneState("column", "active", -1);
    };
  }, []);
  return null;
}
