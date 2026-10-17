import { href } from '../app/paths';
import { dictionaries } from '../content';
import { locales } from '../i18n/locales';

/** 404.html — GitHub Pages serves it for any unknown path, so it is trilingual. */
export function NotFound() {
  return (
    <main className="static-page">
      <p className="static-page__brand">BAYHAN STUDIO</p>
      <ul className="static-page__list">
        {locales.map((code, index) => {
          const t = dictionaries[code].notFound;
          const Heading = index === 0 ? 'h1' : 'h2';
          return (
            <li key={code} lang={code} className="static-page__block">
              <Heading>{t.title}</Heading>
              <p>{t.text}</p>
              <a className="static-page__link" href={href('home', code)} hrefLang={code}>
                {t.backHome}
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
