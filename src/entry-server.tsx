import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { App } from './app/App';
import { buildHead } from './app/head';
import { routePath } from './app/paths';
import { routes, type RouteDefinition } from './app/routes';
import { dictionaries } from './content';
import { defaultLocale, LOCALE_STORAGE_KEY, locales, type Locale } from './i18n/locales';
import { INTRO_SCRIPT } from './motion/intro';
import { LanguageGate } from './static/LanguageGate';
import { NotFound } from './static/NotFound';

const BASE = import.meta.env.BASE_URL;

export interface RenderedPage {
  status: number;
  lang: Locale;
  head: string;
  body: string;
  /** false → client scripts are stripped; the page stays static HTML. */
  hydrate: boolean;
}

/** Every path to prerender, relative to the base ("" is the root language gate). */
export function listPaths(): string[] {
  const pagePaths = locales.flatMap((locale) => routes.map((route) => routePath(route.id, locale)));
  return ['', ...pagePaths];
}

export function renderPath(relativePath: string): RenderedPage | null {
  if (relativePath === '') return renderLanguageGate();
  for (const locale of locales) {
    for (const route of routes) {
      if (routePath(route.id, locale) === relativePath) return renderRoute(route, locale);
    }
  }
  return null;
}

/** Dev-server entry: maps a request pathname to a page, falling back to 404. */
export function renderUrl(pathname: string): RenderedPage {
  if (!`${pathname}/`.startsWith(BASE)) return renderNotFound();
  let relative = pathname.slice(BASE.length);
  if (relative && !relative.endsWith('/')) relative += '/';
  return renderPath(relative) ?? renderNotFound();
}

function renderRoute(route: RouteDefinition, locale: Locale): RenderedPage {
  const t = dictionaries[locale];
  const alternates = Object.fromEntries(
    locales.map((code) => [code, routePath(route.id, code)]),
  ) as Record<Locale, string>;

  return {
    status: 200,
    lang: locale,
    head: `${buildHead({ meta: route.meta(t), siteName: t.meta.siteName, locale, alternates })}\n    <script>${INTRO_SCRIPT}</script>`,
    body: `<div id="root" data-route="${route.id}">${renderToString(
      <App route={route} locale={locale} t={t} />,
    )}</div>`,
    hydrate: true,
  };
}

function renderLanguageGate(): RenderedPage {
  const t = dictionaries[defaultLocale];
  // Remembered explicit choice → browser languages → default. Runs before first paint.
  const redirect = `(function(){var L=${JSON.stringify(locales)},c=null;try{c=localStorage.getItem(${JSON.stringify(
    LOCALE_STORAGE_KEY,
  )})}catch(e){}if(L.indexOf(c)<0){c=null;var n=navigator.languages||[navigator.language||''];for(var i=0;i<n.length&&!c;i++){var p=String(n[i]).slice(0,2).toLowerCase();if(L.indexOf(p)>-1)c=p}}location.replace(${JSON.stringify(
    BASE,
  )}+(c||${JSON.stringify(defaultLocale)})+'/')})();`;

  return {
    status: 200,
    lang: defaultLocale,
    head: `${buildHead({
      meta: { title: t.meta.siteName, description: t.meta.home.description },
      siteName: t.meta.siteName,
    })}\n    <script>${redirect}</script>`,
    body: renderToStaticMarkup(<LanguageGate />),
    hydrate: false,
  };
}

export function renderNotFound(): RenderedPage {
  const t = dictionaries[defaultLocale];
  return {
    status: 404,
    lang: defaultLocale,
    head: buildHead({
      meta: { title: `${t.notFound.title} — ${t.meta.siteName}`, description: t.notFound.text },
      siteName: t.meta.siteName,
      noindex: true,
    }),
    body: renderToStaticMarkup(<NotFound />),
    hydrate: false,
  };
}

/** Inserts a rendered page into the Vite-processed index.html. */
export function applyTemplate(template: string, page: RenderedPage): string {
  let html = template
    .replace(/<html[^>]*>/, `<html lang="${page.lang}">`)
    .replace('<!--app-head-->', () => page.head)
    .replace('<!--app-body-->', () => page.body);

  if (!page.hydrate) {
    html = html
      .replace(/<script type="module"[^>]*><\/script>\s*/g, '')
      .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
  }
  return html;
}
