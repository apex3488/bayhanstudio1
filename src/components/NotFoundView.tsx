"use client";

import { usePathname } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import SceneCanvas from "./SceneCanvas";
import { TLink } from "./Experience";

export type NotFoundStrings = Record<Locale, { t: Dictionary["notFound"]; scene: string }>;

export default function NotFoundView({ strings }: { strings: NotFoundStrings }) {
  const seg = usePathname().split("/")[1];
  const locale = isLocale(seg) ? seg : defaultLocale;
  const { t, scene } = strings[locale];

  return (
    <div className="stage stage--404" data-stage>
      <SceneCanvas scene="ruins" className="stage__scene" label={scene} />
      <section className="nf">
        <p className="nf__code" aria-hidden="true">
          404
        </p>
        <p className="label">{t.label}</p>
        <h1 className="display display--sm">
          {t.title.map((line, i) => (
            <span className="line" key={line}>
              {i === 1 ? <em>{line}</em> : line}{" "}
            </span>
          ))}
        </h1>
        <p className="lead">{t.text}</p>
        <div className="nf__actions">
          <TLink href={`/${locale}`} className="btn btn--primary" data-magnetic>
            <span className="btn__label">{t.home}</span>
            <span className="btn__arrow" aria-hidden="true">
              →
            </span>
          </TLink>
          <TLink href={`/${locale}/work`} className="btn btn--ghost" data-magnetic>
            <span className="btn__label">{t.work}</span>
            <span className="btn__arrow" aria-hidden="true">
              →
            </span>
          </TLink>
        </div>
      </section>
    </div>
  );
}
