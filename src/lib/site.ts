import { locales, type Locale } from "@/i18n/config";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const site = {
  name: "BAYHAN STUDIO",
  url: resolveSiteUrl(),
  telegramHandle: "@APEX348",
  telegramUrl: "https://t.me/APEX348",
  channelHandle: "@Bayhan_studio",
  channelUrl: "https://t.me/Bayhan_studio",
  instagramHandle: "@bayhan_studio01",
  instagramUrl: "https://www.instagram.com/bayhan_studio01/",
} as const;

export const routes = ["", "/about", "/services", "/work", "/contact"] as const;

export function localePath(locale: Locale, path = ""): string {
  return `/${locale}${path}`;
}

/** canonical + hreflang alternates for a route (path without locale prefix). */
export function alternatesFor(locale: Locale, path = "") {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${site.url}/${l}${path}`;
  languages["x-default"] = `${site.url}/ru${path}`;
  return { canonical: `${site.url}/${locale}${path}`, languages };
}
