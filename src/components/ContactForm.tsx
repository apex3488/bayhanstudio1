"use client";

import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";

type Props = {
  t: Dictionary["contact"]["form"];
  services: string[];
  locale: string;
  telegramUrl: string;
  /** True when the server route is configured to deliver leads to Telegram. */
  apiEnabled: boolean;
};

type Status = "idle" | "sending" | "sent" | "opened" | "error";
type Errors = Partial<Record<"name" | "contact" | "message", string>>;

export default function ContactForm({ t, services, locale, telegramUrl, apiEnabled }: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("");

  const compose = (data: FormData) => {
    const get = (k: string) => String(data.get(k) ?? "").trim();
    return {
      fields: {
        name: get("name"),
        contact: get("contact"),
        service: get("service"),
        message: get("message"),
        company: get("company"),
      },
      text: [
        t.msgTitle,
        `${t.msgName}: ${get("name")}`,
        `${t.msgContact}: ${get("contact")}`,
        `${t.msgService}: ${get("service") || t.serviceAny}`,
        `${t.msgTask}: ${get("message")}`,
      ].join("\n"),
    };
  };

  const openTelegram = (text: string) => {
    const url = `${telegramUrl}?text=${encodeURIComponent(text)}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // Pop-up blocked: navigate in the same tab so the action is never lost.
    // external t.me link, not an internal route
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (!win) window.location.assign(url);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { fields, text } = compose(new FormData(form));

    const next: Errors = {};
    if (!fields.name) next.name = t.required;
    if (!fields.contact) next.contact = t.required;
    if (!fields.message) next.message = t.required;
    else if (fields.message.length < 10) next.message = t.tooShort;
    setErrors(next);
    const firstBad = (["name", "contact", "message"] as const).find((k) => next[k]);
    if (firstBad) {
      form.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    setDraft(text);
    setCopied(false);

    if (!apiEnabled) {
      openTelegram(text);
      setStatus("opened");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const field = (name: keyof Errors) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-err` : undefined,
  });
  const error = (name: keyof Errors) =>
    errors[name] ? (
      <span id={`${id}-${name}-err`} className="field__error">
        {errors[name]}
      </span>
    ) : null;

  const message =
    status === "sent" ? t.success : status === "opened" ? t.successTelegram : status === "error" ? t.error : "";

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form__row">
        <label className="field">
          <span className="field__label">{t.name}</span>
          <input name="name" type="text" autoComplete="name" placeholder={t.namePh} maxLength={120} required {...field("name")} />
          {error("name")}
        </label>
        <label className="field">
          <span className="field__label">{t.contact}</span>
          <input name="contact" type="text" autoComplete="off" placeholder={t.contactPh} maxLength={160} required {...field("contact")} />
          {error("contact")}
        </label>
      </div>

      <label className="field">
        <span className="field__label">{t.service}</span>
        <span className="field__select">
          <select name="service" defaultValue="">
            <option value="">{t.serviceAny}</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="field">
        <span className="field__label">{t.message}</span>
        <textarea name="message" rows={5} placeholder={t.messagePh} maxLength={3000} required {...field("message")} />
        {error("message")}
      </label>

      {/* honeypot — hidden from people and assistive tech */}
      <div className="form__trap" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form__foot">
        <button type="submit" className="btn btn--primary" disabled={status === "sending"} data-magnetic>
          <span className="btn__label">
            {status === "sending" ? t.sending : apiEnabled ? t.submitApi : t.submitTelegram}
          </span>
          <span className="btn__arrow" aria-hidden="true">
            ↗
          </span>
        </button>
        <p className="form__note">{apiEnabled ? t.noteApi : t.noteTelegram}</p>
      </div>

      <div className="form__status" role="status" aria-live="polite" data-state={status}>
        {message ? <p>{message}</p> : null}
        {(status === "opened" || status === "error") && draft ? (
          <div className="form__actions">
            {status === "error" ? (
              <button type="button" className="btn btn--ghost" onClick={() => openTelegram(draft)}>
                <span className="btn__label">{t.submitTelegram}</span>
              </button>
            ) : null}
            <button type="button" className="btn btn--ghost" onClick={copy}>
              <span className="btn__label">{copied ? t.copied : t.copy}</span>
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
