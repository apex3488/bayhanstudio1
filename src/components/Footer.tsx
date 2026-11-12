"use client";

import { TLink, useExperience } from "./Experience";
import { LocaleSwitch } from "./Header";
import type { Locale } from "@/i18n/config";
import type { Chrome } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";

export default function Footer({ locale, dict, year }: { locale: Locale; dict: Chrome; year: number }) {
  const { scrollTop } = useExperience();
  const nav = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/services`, label: dict.nav.services },
    { href: `/${locale}/work`, label: dict.nav.work },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];
  const socials = [
    { href: site.telegramUrl, name: dict.menu.telegram, handle: site.telegramHandle },
    { href: site.channelUrl, name: dict.menu.channel, handle: site.channelHandle },
    { href: site.instagramUrl, name: dict.menu.instagram, handle: site.instagramHandle },
  ];

  return (
    <footer id="footer" className="footer">
      <div className="footer__top">
        <div className="footer__col">
          <p className="label">{dict.footer.nav}</p>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <TLink href={n.href} className="ulink">
                  {n.label}
                </TLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <p className="label">{dict.footer.social}</p>
          <ul>
            {socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="ulink">
                  {s.name} <span className="footer__handle">{s.handle}</span>
                  <span className="sr-only"> — {dict.a11y.external}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <p className="label">{dict.menu.lang}</p>
          <LocaleSwitch locale={locale} label={dict.a11y.langSwitch} />
        </div>
        <button type="button" className="footer__up" onClick={scrollTop} data-magnetic>
          <span aria-hidden="true">↑</span> {dict.footer.top}
        </button>
      </div>

      <p className="footer__mark" aria-hidden="true">
        BAYHAN <em>STUDIO</em>
      </p>

      <div className="footer__bottom">
        <p>
          © {year} BAYHAN STUDIO. {dict.footer.rights}
        </p>
        <p>{dict.footer.tagline}</p>
        <p>
          <a href="https://polyhaven.com/a/marble_bust_01" target="_blank" rel="noopener noreferrer" className="ulink">
            {dict.footer.credit}
          </a>
        </p>
      </div>
    </footer>
  );
}
