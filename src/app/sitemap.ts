import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { projects } from "@/content/data";
import { routes, site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...routes, ...projects.map((p) => `/work/${p.slug}`)];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/work/") ? 0.5 : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
      },
    })),
  );
}
