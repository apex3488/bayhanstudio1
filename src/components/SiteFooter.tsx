import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { contacts } from '../content/contacts';
import { ArrowIcon } from './ArrowIcon';
import { ExternalLink } from './ExternalLink';
import { Label } from './Label';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  const { locale, t } = usePage();
  const channels = [
    { label: t.footer.telegram, handle: '@APEX348', href: contacts.telegram },
    { label: t.footer.instagram, handle: '@bayhan_studio01', href: contacts.instagram },
    { label: t.footer.channel, handle: '@Bayhan_studio', href: contacts.telegramChannel },
  ];
  const pages = [
    { label: t.nav.services, href: href('services', locale) },
    { label: t.nav.contact, href: href('contact', locale) },
    { label: t.nav.privacy, href: href('privacy', locale) },
  ];

  return (
    <footer className={styles.footer}>
      <div className={`shell grid ${styles.top}`}>
        <p className={styles.tagline}>{t.footer.tagline}</p>

        <nav className={styles.pages} aria-labelledby="footer-nav">
          <h2 id="footer-nav" className={styles.heading}>
            <Label as="span">{t.footer.navHeading}</Label>
          </h2>
          <ul className={styles.pageList}>
            {pages.map((page) => (
              <li key={page.href}>
                <a className={styles.pageLink} href={page.href}>
                  {page.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.contacts} aria-labelledby="footer-contacts">
          <h2 id="footer-contacts" className={styles.heading}>
            <Label as="span">{t.footer.contactsHeading}</Label>
          </h2>
          <ul className={styles.links}>
            {channels.map((channel) => (
              <li key={channel.href}>
                <ExternalLink className={styles.link} href={channel.href}>
                  <span className={styles.channel}>{channel.label}</span>
                  <span className={styles.handle}>{channel.handle}</span>
                  <span className={styles.arrow}>
                    <ArrowIcon direction="external" />
                  </span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className={`shell ${styles.wordmark}`} aria-hidden="true">
        BAYHAN
      </p>

      <div className={`shell ${styles.bottom}`}>
        <p>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {t.meta.siteName}.{' '}
          {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
