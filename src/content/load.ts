import type { Locale } from '../i18n/locales';
import type { Dictionary } from '../i18n/types';

/** Client-side: each locale is its own chunk, fetched only for pages in that language. */
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  ru: () => import('./ru').then((m) => m.ru),
  en: () => import('./en').then((m) => m.en),
  uz: () => import('./uz').then((m) => m.uz),
};

export function loadDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
