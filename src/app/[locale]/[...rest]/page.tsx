import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "404 — BAYHAN STUDIO", robots: { index: false } };

// Any unknown path under a locale renders the localized 404.
export default function CatchAll() {
  notFound();
}
