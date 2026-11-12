import type { Metadata } from "next";
import { ogLocales, type Locale } from "@/i18n/config";
import { alternatesFor, site } from "@/lib/site";

export function pageMeta(
  locale: Locale,
  path: string,
  { title, description }: { title: string; description: string },
): Metadata {
  const alternates = alternatesFor(locale, path);
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: site.name,
      locale: ogLocales[locale],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
