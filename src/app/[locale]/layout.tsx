import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Cormorant, JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";
import { Experience } from "@/components/Experience";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import Hud from "@/components/Hud";
import "@/styles/globals.css";
import "@/styles/v2.css";
import "@/styles/v3.css";

// Unbounded: a wide geometric grotesque for headlines — the "future".
const head = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-head",
  display: "swap",
});
// Cormorant italic: the classical counter-voice — the "antique".
const display = Cormorant({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const sans = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic", "greek"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#050609",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    applicationName: site.name,
    formatDetection: { telephone: false },
  };
}

// Runs before first paint: marks JS as available and whether motion is welcome,
// so content is never hidden for visitors without JS or with reduced motion.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('js-motion')}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const chrome = { nav: dict.nav, menu: dict.menu, a11y: dict.a11y, footer: dict.footer };

  // Structured data: only facts that are confirmed.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: `${site.url}/${locale}`,
    description: dict.meta.home.description,
    sameAs: [site.telegramUrl, site.channelUrl, site.instagramUrl],
  };

  return (
    <html lang={locale} className={`${head.variable} ${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="boot" strategy="beforeInteractive">
          {bootScript}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skip" href="#main">
          {dict.a11y.skip}
        </a>
        <Experience>
          <Header locale={locale} dict={chrome} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer locale={locale} dict={chrome} year={new Date().getFullYear()} />
          <Hud />
          <Cursor />
        </Experience>
      </body>
    </html>
  );
}
