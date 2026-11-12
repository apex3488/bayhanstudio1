export const locales = ["ru", "en", "uz"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
export const LOCALE_COOKIE = "bayhan_locale";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O‘zbekcha",
};

export const ogLocales: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
  uz: "uz_UZ",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Swap the locale segment of a pathname, keeping the rest of the route. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = next;
  else parts.splice(1, 0, next);
  const out = parts.join("/");
  return out === "" ? `/${next}` : out;
}
