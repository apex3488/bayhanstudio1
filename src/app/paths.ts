import type { Locale } from '../i18n/locales';
import { routeSegment, type RouteId } from './routeIds';

const BASE = import.meta.env.BASE_URL;

/** Path relative to the site base, e.g. "ru/" or "en/services/". */
export function routePath(id: RouteId, locale: Locale): string {
  const segment = routeSegment(id);
  return segment ? `${locale}/${segment}/` : `${locale}/`;
}

/** Base-aware href for internal links. Never hardcode "/ru/..." in components. */
export function href(id: RouteId, locale: Locale): string {
  return BASE + routePath(id, locale);
}

/** Brief page with the project type preselected. */
export function contactHref(locale: Locale, type?: string): string {
  return type
    ? `${href('contact', locale)}?type=${encodeURIComponent(type)}`
    : href('contact', locale);
}

/** Base-aware URL of a file served from /public. */
export function assetUrl(path: string): string {
  return BASE + path.replace(/^\/+/, '');
}

/** Absolute URL for canonical / hreflang / Open Graph. */
export function absoluteUrl(relativePath: string): string {
  return __SITE_ORIGIN__ + BASE + relativePath;
}
