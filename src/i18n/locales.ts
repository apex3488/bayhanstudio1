export const locales = ['ru', 'en', 'uz'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

/** Only an explicit language choice is remembered, and only to route the bare root URL. */
export const LOCALE_STORAGE_KEY = 'bayhan.locale';

export const localeNames: Record<Locale, { native: string; short: string }> = {
  ru: { native: 'Русский', short: 'RU' },
  en: { native: 'English', short: 'EN' },
  uz: { native: 'Oʻzbekcha', short: 'UZ' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function rememberLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be blocked (private mode, policies); the URL still carries the locale.
  }
}
