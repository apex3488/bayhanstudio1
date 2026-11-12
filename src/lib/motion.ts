import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

let registered = false;
export function registerMotion() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
  registered = true;
}

let failed = false;
/** Turn all scripted motion off (used when animation setup throws). */
export function disableMotion() {
  failed = true;
  document.documentElement.classList.remove("js-motion");
}

/**
 * Whether scripted motion should run. Also re-asserts the <html> flags the CSS
 * relies on: React may reset that element's attributes when it renders the
 * document on the client (e.g. the 404 page).
 */
export function motionEnabled(): boolean {
  const root = document.documentElement;
  const ok = !failed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  root.classList.toggle("js-motion", ok);
  return ok;
}

const DRAWABLE = "path, line, circle, rect, polyline, polygon, ellipse";

function prepareDraw(svg: Element): SVGGeometryElement[] {
  const shapes = Array.from(svg.querySelectorAll<SVGGeometryElement>(DRAWABLE)).filter(
    (s) => !s.closest("[data-nodraw]") && typeof s.getTotalLength === "function",
  );
  for (const s of shapes) {
    let len = 0;
    try {
      len = s.getTotalLength();
    } catch {
      len = 0;
    }
    s.style.strokeDasharray = `${len + 1}`;
    s.style.strokeDashoffset = `${len + 1}`;
  }
  return shapes;
}

/**
 * Wires every declarative animation inside `root`.
 * One vocabulary — "raising": type rises from behind a mask, plates are unveiled
 * upwards, drawings are traced, hairlines are ruled. Returns a cleanup function.
 */
export function initPageMotion(root: HTMLElement, opts: { intro: boolean }): () => void {
  if (!motionEnabled()) return () => {};
  registerMotion();
  const introDelay = opts.intro ? 0.75 : 0.45;
  const splits: SplitText[] = [];
  const cleanups: (() => void)[] = [];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const mm = gsap.matchMedia();

  const ctx = gsap.context(() => {
    /* --- type: lines / characters rising from a mask --- */
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
      const chars = el.dataset.split === "chars";
      const hero = el.hasAttribute("data-hero");
      const delay = hero ? introDelay + Number(el.dataset.delay ?? 0) : Number(el.dataset.delay ?? 0);
      const split = SplitText.create(el, {
        type: chars ? "lines,chars" : "lines",
        mask: "lines",
        linesClass: "sl",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(chars ? self.chars : self.lines, {
            yPercent: 118,
            rotate: chars ? 4 : 0,
            duration: chars ? 1.15 : 1,
            ease: "expo.out",
            stagger: chars ? 0.024 : 0.085,
            delay,
            scrollTrigger: hero ? undefined : { trigger: el, start: "top 88%", once: true },
          }),
      });
      splits.push(split);
      gsap.set(el, { visibility: "visible" });
    });

    /* --- manifesto: words lit by the scroll --- */
    root.querySelectorAll<HTMLElement>("[data-scrub]").forEach((el) => {
      const split = SplitText.create(el, { type: "words", wordsClass: "sw" });
      splits.push(split);
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(
        split.words,
        { opacity: 0.13 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.4 },
        },
      );
    });

    /* --- simple reveals --- */
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      const kind = el.dataset.reveal;
      const hero = el.hasAttribute("data-hero");
      const delay = (hero ? introDelay : 0) + Number(el.dataset.delay ?? 0);
      const scrollTrigger = hero ? undefined : { trigger: el, start: "top 90%", once: true };
      gsap.set(el, { visibility: "visible" });
      if (kind === "clip") {
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", delay, scrollTrigger, clearProps: "clipPath" },
        );
        const inner = el.firstElementChild;
        if (inner) gsap.from(inner, { scale: 1.12, duration: 1.6, ease: "expo.out", delay, scrollTrigger });
      } else if (kind === "line") {
        gsap.from(el, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.4, ease: "expo.inOut", delay, scrollTrigger });
      } else if (kind === "stagger") {
        gsap.from(el.children, {
          y: 28,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.07,
          delay,
          scrollTrigger,
        });
      } else {
        gsap.from(el, { y: 26, autoAlpha: 0, duration: 1, ease: "power3.out", delay, scrollTrigger });
      }
    });

    /* --- traced drawings --- */
    root.querySelectorAll<SVGElement>("svg[data-draw]").forEach((svg) => {
      const shapes = prepareDraw(svg);
      gsap.set(svg, { visibility: "visible" });
      gsap.to(shapes, {
        strokeDashoffset: 0,
        duration: 1.7,
        ease: "power2.inOut",
        stagger: { amount: 0.9 },
        delay: Number(svg.dataset.delay ?? 0),
        scrollTrigger: { trigger: svg, start: "top 88%", once: true },
      });
    });

    /* --- layered parallax --- */
    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
      const v = Number(el.dataset.parallax ?? 0.15);
      gsap.fromTo(
        el,
        { y: () => v * 140 },
        {
          y: () => v * -140,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        },
      );
    });

    /* --- labels decode themselves out of Greek glyphs --- */
    root.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el) => {
      const text = el.textContent ?? "";
      const hero = !!el.closest("[data-hero]");
      const scrollTrigger = { trigger: el, start: "top 94%", once: true };
      gsap.set(el, { visibility: "visible" });
      gsap.from(el, { opacity: 0, duration: 0.3, delay: hero ? introDelay : 0, scrollTrigger });
      gsap.to(el, {
        duration: Math.min(1.8, 0.6 + text.length * 0.035),
        delay: hero ? introDelay : 0,
        scrambleText: { text, chars: "ΑΒΓΔΘΛΞΠΣΦΨΩ01", speed: 0.45, revealDelay: 0.15 },
        scrollTrigger,
      });
    });

    /* --- counters --- */
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count ?? 0);
      const state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: 1.8,
        ease: "power3.out",
        delay: el.closest("[data-hero]") ? introDelay + 1.4 : 0.1,
        scrollTrigger: { trigger: el, start: "top 96%", once: true },
        onUpdate: () => {
          el.textContent = pad2(Math.round(state.v));
        },
      });
    });

    /* --- 3D tilt towards the pointer --- */
    if (finePointer) {
      root.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        gsap.set(el, { transformPerspective: 1100, transformStyle: "preserve-3d" });
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.7, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.7, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          ry(nx * 9);
          rx(-ny * 7);
          el.style.setProperty("--mx", `${(nx + 0.5) * 100}%`);
          el.style.setProperty("--my", `${(ny + 0.5) * 100}%`);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });

      /* --- service previews follow the pointer --- */
      root.querySelectorAll<HTMLElement>(".order__row").forEach((row) => {
        const plate = row.querySelector<HTMLElement>(".order__plate");
        if (!plate) return;
        const qx = gsap.quickTo(plate, "x", { duration: 0.55, ease: "power3.out" });
        const qy = gsap.quickTo(plate, "y", { duration: 0.55, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = row.getBoundingClientRect();
          qx(e.clientX - r.left);
          qy(e.clientY - r.top);
        };
        row.addEventListener("pointermove", move);
        cleanups.push(() => row.removeEventListener("pointermove", move));
      });
    }

    /* --- marquees: constant drift, pushed and skewed by scroll velocity --- */
    root.querySelectorAll<HTMLElement>("[data-marquee]").forEach((el) => {
      const inner = el.querySelector<HTMLElement>(".marquee__inner");
      const row = inner?.firstElementChild as HTMLElement | null;
      if (!inner || !row) return;
      const dir = Number(el.dataset.marquee) || 1;
      let width = row.offsetWidth || 1;
      const ro = new ResizeObserver(() => {
        width = row.offsetWidth || 1;
      });
      ro.observe(row);
      let x = 0;
      let lastY = window.scrollY;
      let vel = 0;
      const tick = (_time: number, delta: number) => {
        const dt = Math.min(delta, 60) / 1000;
        const y = window.scrollY;
        const raw = dt > 0 ? (y - lastY) / dt : 0;
        lastY = y;
        vel += (raw - vel) * 0.12;
        x -= dir * (70 + Math.abs(vel) * 0.22) * dt * (vel < -40 ? -1 : 1);
        x = ((x % width) - width) % width;
        const skew = Math.max(-9, Math.min(9, vel / 180));
        inner.style.transform = `translate3d(${x}px,0,0) skewX(${-skew * dir}deg)`;
      };
      gsap.ticker.add(tick);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        ro.disconnect();
      });
    });

    /* --- the Canon: a temple façade raised stage by stage --- */
    const canon = root.querySelector<HTMLElement>("[data-canon]");
    if (canon) {
      const pin = canon.querySelector<HTMLElement>(".canon__pin")!;
      const steps = gsap.utils.toArray<HTMLElement>(".canon__step", canon);
      const groups = gsap.utils.toArray<SVGGElement>("[data-build]", canon);
      const bar = canon.querySelector<HTMLElement>(".canon__bar i");
      const marks = gsap.utils.toArray<HTMLElement>(".canon__mark", canon);
      const drawn = groups.map((g) => prepareDraw(g));
      gsap.set(canon.querySelector("svg"), { visibility: "visible" });

      mm.add("(min-width: 960px)", () => {
        canon.classList.add("is-pinned");
        gsap.set(steps, { autoAlpha: 0, y: 40 });
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${window.innerHeight * 3}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        steps.forEach((step, i) => {
          tl.to(step, { autoAlpha: 1, y: 0, duration: 0.35 }, i);
          tl.to(drawn[i], { strokeDashoffset: 0, duration: 0.8, stagger: { amount: 0.3 } }, i);
          if (marks[i]) tl.to(marks[i], { color: "#38A4FF", duration: 0.2 }, i);
          if (i < steps.length - 1) tl.to(step, { autoAlpha: 0, y: -40, duration: 0.3 }, i + 0.7);
        });
        if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: steps.length }, 0);
        return () => {
          canon.classList.remove("is-pinned");
          gsap.set(steps, { clearProps: "all" });
        };
      });

      mm.add("(max-width: 959.98px)", () => {
        drawn.forEach((shapes, i) => {
          gsap.to(shapes, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.inOut",
            stagger: { amount: 0.4 },
            scrollTrigger: { trigger: steps[i] ?? canon, start: "top 75%", once: true },
          });
        });
        gsap.from(steps, {
          y: 30,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: steps[0], start: "top 85%", once: true },
        });
      });
    }

  }, root);

  const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 120);

  return () => {
    window.clearTimeout(refresh);
    cleanups.forEach((fn) => fn());
    mm.revert();
    ctx.revert();
    splits.forEach((s) => s.revert());
  };
}
