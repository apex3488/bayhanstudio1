import { locales, type Locale } from '../i18n/locales';
import type { PageMeta } from '../i18n/types';
import { absoluteUrl } from './paths';

const OG_LOCALES: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US', uz: 'uz_UZ' };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface HeadOptions {
  meta: PageMeta;
  siteName: string;
  locale?: Locale;
  /** Path relative to the base for each locale version of this page. */
  alternates?: Record<Locale, string>;
  /** Pages like 404 must not be indexed. */
  noindex?: boolean;
}

export function buildHead({ meta, siteName, locale, alternates, noindex }: HeadOptions): string {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  ];

  if (noindex) tags.push('<meta name="robots" content="noindex" />');

  if (locale && alternates) {
    const canonical = absoluteUrl(alternates[locale]);
    tags.push(`<link rel="canonical" href="${canonical}" />`);
    for (const alt of locales) {
      tags.push(
        `<link rel="alternate" hreflang="${alt}" href="${absoluteUrl(alternates[alt])}" />`,
      );
    }
    tags.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl('')}" />`);
    tags.push(
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
      `<meta property="og:url" content="${canonical}" />`,
      `<meta property="og:locale" content="${OG_LOCALES[locale]}" />`,
    );
  }

  return tags.join('\n    ');
}
