import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { localeNames, locales, rememberLocale } from '../i18n/locales';
import styles from './LangSwitch.module.css';

/** Plain links to the same page in other locales — works without JavaScript. */
export function LangSwitch() {
  const { locale, routeId, t } = usePage();
  return (
    <nav aria-label={t.a11y.languageSwitch}>
      <ul className={styles.list}>
        {locales.map((code) => (
          <li key={code}>
            <a
              className={styles.link}
              href={href(routeId, code)}
              hrefLang={code}
              lang={code}
              aria-current={code === locale ? 'page' : undefined}
              onClick={() => rememberLocale(code)}
            >
              <span aria-hidden="true">{localeNames[code].short}</span>
              <span className="visually-hidden">{localeNames[code].native}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
