import { ImageResponse } from "next/og";
import { locales } from "@/i18n/config";

export const alt = "BAYHAN STUDIO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Wordmark only: the default OG font has no Cyrillic, so no localized copy here.
export default function OpengraphImage() {
  const cols = Array.from({ length: 9 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050609",
          color: "#F4F6FA",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", height: 6, width: 220, background: "#146CFF" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 148, letterSpacing: -4, lineHeight: 1 }}>BAYHAN</div>
          <div style={{ display: "flex", fontSize: 148, letterSpacing: -4, lineHeight: 1, color: "#A6D9FF" }}>STUDIO</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", height: 120 }}>
          {cols.map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 44,
                height: 40 + ((i * 37) % 80),
                marginRight: 22,
                borderLeft: "2px solid rgba(166,217,255,0.5)",
                borderRight: "2px solid rgba(166,217,255,0.5)",
                borderTop: i % 3 === 0 ? "4px solid #38A4FF" : "2px solid rgba(166,217,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
