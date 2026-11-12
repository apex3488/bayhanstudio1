"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { TLink, useExperience } from "./Experience";
import { LOCALE_COOKIE, locales, switchLocalePath, type Locale } from "@/i18n/config";
import type { Chrome } from "@/i18n/get-dictionary";
import { numerals } from "@/content/data";
import { site } from "@/lib/site";
import { motionEnabled } from "@/lib/motion";

type Props = { locale: Locale; dict: Chrome };

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleSwitch({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={`locales ${className ?? ""}`} aria-label={label}>
      {locales.map((l) => (
        <TLink
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className="locales__item"
          onClick={() => rememberLocale(l)}
        >
          {l.toUpperCase()}
        </TLink>
      ))}
    </nav>
  );
}

export default function Header({ locale, dict }: Props) {
  const pathname = usePathname();
  const { lockScroll } = useExperience();
  // the menu is open only for the route it was opened on: navigating closes it
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = useCallback((next: boolean) => setOpenAt(next ? pathname : null), [pathname]);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/work`, label: dict.nav.work },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  const close = useCallback(() => setOpen(false), [setOpen]);

  // a link to the current page was clicked: just close
  useEffect(() => {
    window.addEventListener("experience:samepage", close);
    return () => window.removeEventListener("experience:samepage", close);
  }, [close]);

  // open / close choreography + focus management
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const main = document.getElementById("main");
    const footer = document.getElementById("footer");
    lockScroll(open);
    for (const node of [main, footer]) {
      if (!node) continue;
      if (open) node.setAttribute("inert", "");
      else node.removeAttribute("inert");
    }

    tl.current?.kill();
    const colsEl = el.querySelectorAll(".menu__col");
    const items = el.querySelectorAll(".menu__link-inner");
    const side = el.querySelectorAll(".menu__side > *");
    const animate = motionEnabled();

    if (open) {
      gsap.set(el, { visibility: "visible" });
      if (animate) {
        tl.current = gsap
          .timeline()
          .fromTo(
            colsEl,
            { scaleY: 0, transformOrigin: "50% 0%" },
            { scaleY: 1, duration: 0.8, ease: "expo.inOut", stagger: 0.05 },
          )
          .fromTo(
            items,
            { yPercent: 115, rotate: 3 },
            { yPercent: 0, rotate: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 },
            0.35,
          )
          .fromTo(side, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.55);
      } else {
        gsap.set(colsEl, { scaleY: 1 });
        gsap.set(items, { yPercent: 0, rotate: 0 });
        gsap.set(side, { autoAlpha: 1, y: 0 });
      }
      const firstLink = el.querySelector<HTMLElement>("a");
      window.setTimeout(() => firstLink?.focus({ preventScroll: true }), animate ? 350 : 0);
    } else if (animate) {
      tl.current = gsap
        .timeline({ onComplete: () => gsap.set(el, { visibility: "hidden" }) })
        .to(items, { yPercent: -115, duration: 0.4, ease: "power3.in", stagger: 0.025 })
        .to(side, { autoAlpha: 0, duration: 0.25 }, 0)
        .to(colsEl, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.6, ease: "expo.inOut", stagger: 0.04 }, 0.15);
    } else {
      gsap.set(el, { visibility: "hidden" });
    }

    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      // focus trap: the toggle button plus everything inside the panel
      const focusables = [
        toggle.current!,
        ...Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")),
      ];
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (!focusables.includes(active as HTMLElement)) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, lockScroll, setOpen]);

  const socials = [
    { href: site.telegramUrl, name: dict.menu.telegram, handle: site.telegramHandle },
    { href: site.channelUrl, name: dict.menu.channel, handle: site.channelHandle },
    { href: site.instagramUrl, name: dict.menu.instagram, handle: site.instagramHandle },
  ];

  return (
    <>
      <header className={`header ${open ? "is-open" : ""}`}>
        <TLink href={`/${locale}`} className="header__logo" aria-label={dict.a11y.homeLink}>
          <span className="header__logo-main">BAYHAN</span>
          <span className="header__logo-sub">STUDIO</span>
        </TLink>
        <div className="header__right">
          <nav className="header__nav" aria-label={dict.menu.label}>
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <LocaleSwitch locale={locale} label={dict.a11y.langSwitch} className="header__locales" />
          <button
            ref={toggle}
            type="button"
            className="burger"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? dict.a11y.closeMenu : dict.a11y.openMenu}
            onClick={() => setOpen(!open)}
            data-magnetic
          >
            <span className="burger__lines" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      <div
        ref={panel}
        id="site-menu"
        className="menu"
        role="dialog"
        aria-modal="true"
        aria-label={dict.a11y.menu}
        aria-hidden={!open}
      >
        <div className="menu__cols" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="menu__col" />
          ))}
        </div>
        <div className="menu__body">
          <nav className="menu__nav" aria-label={dict.menu.label}>
            <ul>
              {links.map((l, i) => {
                const current = pathname === l.href;
                return (
                  <li key={l.href}>
                    <TLink
                      href={l.href}
                      className="menu__link"
                      aria-current={current ? "page" : undefined}
                      tabIndex={open ? 0 : -1}
                    >
                      <span className="menu__link-inner">
                        <span className="menu__num">{numerals[i]}</span>
                        <span className="menu__text">{l.label}</span>
                      </span>
                    </TLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="menu__side">
            <p className="label">{dict.menu.socials}</p>
            <ul className="menu__socials">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                    <span>{s.name}</span>
                    <span className="menu__handle">{s.handle}</span>
                    <span className="sr-only"> — {dict.a11y.external}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="label">{dict.menu.lang}</p>
            <LocaleSwitch locale={locale} label={dict.a11y.langSwitch} className="menu__locales" />
          </div>
        </div>
      </div>
    </>
  );
}
