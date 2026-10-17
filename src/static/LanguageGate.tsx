import { dictionaries } from '../content';
import { localeNames, locales } from '../i18n/locales';
import { href } from '../app/paths';

/**
 * Root page ("/"): links to every locale. It is not hydrated; a tiny inline
 * script (see entry-server) forwards visitors with JavaScript to their language.
 */
export function LanguageGate() {
  return (
    <main className="static-page">
      <h1 className="static-page__brand">BAYHAN STUDIO</h1>
      <ul className="static-page__list">
        {locales.map((code) => (
          <li key={code} lang={code}>
            <a className="static-page__link" href={href('home', code)} hrefLang={code}>
              {localeNames[code].native} — {dictionaries[code].languageGate.prompt}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
