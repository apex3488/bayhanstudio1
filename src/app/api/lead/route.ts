import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Lead = { name: string; contact: string; service: string; message: string; locale: string; company?: string };

// Best-effort throttle. Serverless instances are short-lived, so this only
// softens bursts; it is not a security boundary.
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) hits.set(ip, { count: 1, reset: now + WINDOW });
  else if (++entry.count > LIMIT) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  let body: Partial<Lead>;
  try {
    body = (await request.json()) as Partial<Lead>;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  if (clean(body.company, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const contact = clean(body.contact, 160);
  const service = clean(body.service, 160);
  const message = clean(body.message, 3000);
  const locale = clean(body.locale, 8);
  if (!name || !contact || message.length < 10) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 422 });
  }

  const text = [
    "BAYHAN STUDIO — new lead",
    `Name: ${name}`,
    `Contact: ${contact}`,
    `Service: ${service || "—"}`,
    `Locale: ${locale || "—"}`,
    "",
    message,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch {
    // Never echo upstream details (they may include the token in URLs).
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
