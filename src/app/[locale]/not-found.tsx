import type { Metadata } from "next";
import NotFoundView, { type NotFoundStrings } from "@/components/NotFoundView";
import ru from "@/i18n/dictionaries/ru";
import en from "@/i18n/dictionaries/en";
import uz from "@/i18n/dictionaries/uz";

export const metadata: Metadata = {
  title: "404 — BAYHAN STUDIO",
  robots: { index: false, follow: true },
};

// not-found.tsx receives no route params, so the view picks the language
// from the URL on the client. Only the 404 strings are sent down.
const strings: NotFoundStrings = {
  ru: { t: ru.notFound, scene: ru.a11y.scenes.ruins },
  en: { t: en.notFound, scene: en.a11y.scenes.ruins },
  uz: { t: uz.notFound, scene: uz.a11y.scenes.ruins },
};

export default function NotFound() {
  return <NotFoundView strings={strings} />;
}
