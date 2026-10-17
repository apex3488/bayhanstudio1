import { useEffect, useId, useRef, useState } from 'react';
import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import type { RouteId } from '../app/routeIds';
import { contacts } from '../content/contacts';
import { ButtonLink } from './ButtonLink';
import { SoundToggle } from '../features/sound/SoundToggle';
import { LangSwitch } from './LangSwitch';
import { Logo } from './Logo';
import styles from './SiteHeader.module.css';
import { useHeaderVisibility } from './useHeaderVisibility';

function isSection(current: RouteId, target: 'services' | 'contact'): boolean {
  return target === 'services'
    ? current === 'services' || current.startsWith('service:')
    : current === target;
}

export function SiteHeader() {
  const { locale, routeId, t } = usePage();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const { scrolled, hidden } = useHeaderVisibility(open);

  const links = [
    { key: 'work', label: t.nav.work, href: `${href('home', locale)}#work`, current: false },
    {
      key: 'services',
      label: t.nav.services,
      href: href('services', locale),
      current: isSection(routeId, 'services'),
    },
    {
      key: 'contact',
      label: t.nav.contact,
      href: href('contact', locale),
      current: isSection(routeId, 'contact'),
    },
  ];

  // Mobile menu: lock page scroll, make the page behind inert, close on Escape.
  useEffect(() => {
    if (!open) return;
    const behind = [
      document.getElementById('main'),
      document.querySelector('body > #root > footer'),
    ];
    behind.forEach((el) => el?.setAttribute('inert', ''));
    document.documentElement.classList.add('menu-open');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      behind.forEach((el) => el?.removeAttribute('inert'));
      document.documentElement.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled || undefined}
      data-hidden={hidden || undefined}
      data-open={open || undefined}
    >
      <div className={`shell ${styles.inner}`}>
        <a className={styles.home} href={href('home', locale)} aria-label={t.a11y.homeLink}>
          <Logo />
        </a>

        <nav className={styles.nav} aria-label={t.a11y.mainNav}>
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.key}>
                <a
                  className={styles.navLink}
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <SoundToggle />
          <div className={styles.lang}>
            <LangSwitch />
          </div>
          <ButtonLink className={styles.cta} href={contacts.telegram} variant="secondary" external>
            {t.hero.ctaTelegram}
          </ButtonLink>
          <button
            ref={toggle}
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? t.a11y.menuClose : t.a11y.menuOpen}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.menuIcon} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id={panelId} className={styles.panel} hidden={!open}>
        <nav aria-label={t.a11y.mainNav} className="shell">
          <ul className={styles.panelList}>
            {links.map((link, index) => (
              <li key={link.key}>
                <a
                  className={styles.panelLink}
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.panelIndex} aria-hidden="true">
                    0{index + 1}
                  </span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href={contacts.telegram} external size="l">
            {t.hero.ctaTelegram}
          </ButtonLink>
          <div className={styles.panelLang}>
            <LangSwitch />
          </div>
        </nav>
      </div>
    </header>
  );
}
