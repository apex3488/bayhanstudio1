"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { disableMotion, initPageMotion, motionEnabled, registerMotion } from "@/lib/motion";

type Api = {
  navigate: (href: string) => void;
  lockScroll: (locked: boolean) => void;
  scrollTop: () => void;
};

const ExperienceContext = createContext<Api>({
  navigate: () => {},
  lockScroll: () => {},
  scrollTop: () => {},
});

export const useExperience = () => useContext(ExperienceContext);

const COLS = 7;

/**
 * Owns everything global to the experience: smooth scroll, the colonnade
 * page transition and per-route animation setup.
 */
export function Experience({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const covered = useRef(true);
  const busy = useRef(false);
  const first = useRef(true);
  const failsafe = useRef(0);

  const cols = () => Array.from(curtain.current?.querySelectorAll<HTMLElement>(".curtain__col") ?? []);

  const reveal = useCallback(() => {
    const el = curtain.current;
    if (!el) return;
    window.clearTimeout(failsafe.current);
    busy.current = false;
    if (!covered.current || !motionEnabled()) {
      covered.current = false;
      gsap.set(el, { autoAlpha: 0 });
      return;
    }
    covered.current = false;
    el.style.animation = "none";
    gsap.to(el.querySelectorAll(".curtain__mark, .curtain__count"), { autoAlpha: 0, y: -16, duration: 0.4, ease: "power2.in" });
    gsap.to(cols(), {
      scaleY: 0,
      transformOrigin: "50% 0%",
      duration: 0.95,
      ease: "expo.inOut",
      stagger: 0.055,
      delay: 0.1,
      onComplete: () => {
        gsap.set(el, { autoAlpha: 0 });
        el.classList.remove("is-first");
      },
    });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        window.dispatchEvent(new Event("experience:samepage"));
        if (lenis.current) lenis.current.scrollTo(0);
        else window.scrollTo({ top: 0 });
        return;
      }
      if (busy.current) return;
      const el = curtain.current;
      if (!el || !motionEnabled()) {
        router.push(href);
        return;
      }
      busy.current = true;
      covered.current = true;
      el.style.animation = "none";
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(
        cols(),
        { scaleY: 0, transformOrigin: "50% 100%" },
        {
          scaleY: 1,
          duration: 0.6,
          ease: "expo.inOut",
          stagger: 0.04,
          onComplete: () => {
            router.push(href);
            // never leave the visitor behind a closed curtain
            failsafe.current = window.setTimeout(reveal, 4000);
          },
        },
      );
    },
    [router, reveal],
  );

  const lockScroll = useCallback((locked: boolean) => {
    if (locked) lenis.current?.stop();
    else lenis.current?.start();
    document.documentElement.classList.toggle("is-locked", locked);
  }, []);

  const scrollTop = useCallback(() => {
    if (lenis.current) lenis.current.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Smooth scroll: Lenis only eases the native scroll, it never hijacks it.
  useEffect(() => {
    registerMotion();
    if (!motionEnabled()) return;
    const instance = new Lenis({ lerp: 0.12, wheelMultiplier: 1, anchors: true });
    lenis.current = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // Per-route: reset scroll, wire animations, lift the curtain.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    let cancelled = false;
    let cleanup = () => {};

    // honour #anchors (e.g. /services#web), otherwise start from the top
    const anchor = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      return id ? document.getElementById(id) : null;
    };
    if (!anchor()) {
      window.scrollTo(0, 0);
      lenis.current?.scrollTo(0, { immediate: true, force: true });
    }

    const start = () => {
      const target = anchor();
      if (target) {
        if (lenis.current) lenis.current.scrollTo(target, { immediate: true, force: true, offset: -90 });
        else target.scrollIntoView();
      }
      if (cancelled) return;
      try {
        cleanup = initPageMotion(main, { intro: first.current });
      } catch (err) {
        console.warn("[motion] disabled after an error", err);
        disableMotion();
      }
      const wasFirst = first.current;
      first.current = false;
      const count = curtain.current?.querySelector<HTMLElement>(".curtain__count");
      if (wasFirst && count && motionEnabled()) {
        // short loading read-out, then the colonnade lifts
        const state = { v: 0 };
        gsap.to(state, {
          v: 100,
          duration: 1.1,
          ease: "power2.inOut",
          onUpdate: () => {
            count.textContent = String(Math.round(state.v)).padStart(3, "0");
          },
          onComplete: reveal,
        });
      } else {
        reveal();
      }
    };

    if (first.current) {
      const fonts = document.fonts?.ready ?? Promise.resolve();
      Promise.race([fonts, new Promise((r) => setTimeout(r, 1400))]).then(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname, reveal]);

  const api = useMemo(() => ({ navigate, lockScroll, scrollTop }), [navigate, lockScroll, scrollTop]);

  return (
    <ExperienceContext.Provider value={api}>
      {children}
      <div ref={curtain} className="curtain is-first" aria-hidden="true">
        {Array.from({ length: COLS }, (_, i) => (
          <span key={i} className="curtain__col" />
        ))}
        <span className="curtain__mark">BAYHAN STUDIO</span>
        <span className="curtain__count">000</span>
      </div>
    </ExperienceContext.Provider>
  );
}

type TLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** next/link with the colonnade transition. Modified clicks behave natively. */
export function TLink({ href, onClick, children, ...rest }: TLinkProps) {
  const { navigate } = useExperience();
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
