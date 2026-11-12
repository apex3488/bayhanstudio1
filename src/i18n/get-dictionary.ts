import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/ru";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  ru: () => import("./dictionaries/ru").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
  uz: () => import("./dictionaries/uz").then((m) => m.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}

export type { Dictionary };

/** The slice of the dictionary that client-side chrome (header, menu, footer) needs. */
export type Chrome = Pick<Dictionary, "nav" | "menu" | "a11y" | "footer">;
