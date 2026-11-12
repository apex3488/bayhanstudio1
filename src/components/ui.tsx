import type { ReactNode } from "react";
import Image from "next/image";
import { TLink } from "./Experience";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { numerals, type ProjectMeta } from "@/content/data";
import { asset, site } from "@/lib/site";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external,
  externalLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
  externalLabel?: string;
}) {
  const inner = (
    <>
      <span className="btn__label">{children}</span>
      <span className="btn__arrow" aria-hidden="true">
        {external ? "↗" : "→"}
      </span>
    </>
  );
  if (external) {
    return (
      <a href={href} className={`btn btn--${variant}`} target="_blank" rel="noopener noreferrer" data-magnetic>
        {inner}
        {externalLabel ? <span className="sr-only"> — {externalLabel}</span> : null}
      </a>
    );
  }
  return (
    <TLink href={href} className={`btn btn--${variant}`} data-magnetic>
      {inner}
    </TLink>
  );
}

/** Title made of lines; the line at `accent` is set in italic serif. */
export function TitleLines({ lines, accent = 1 }: { lines: string[]; accent?: number }) {
  return (
    <>
      {lines.map((line, i) => (
        <span className="line" key={i}>
          {i === accent ? <em>{line}</em> : line}{" "}
        </span>
      ))}
    </>
  );
}

/** Mono label that decodes itself from Greek glyphs when it enters the viewport. */
export function Label({ children, num, id }: { children: string; num?: number; id?: string }) {
  return (
    <p className="label" id={id}>
      {num !== undefined ? <span className="shead__num">{numerals[num]}</span> : null}
      <span data-scramble>{children}</span>
    </p>
  );
}

export function SectionHead({
  label,
  title,
  lead,
  index,
}: {
  label: string;
  title: string;
  lead?: string;
  index?: number;
}) {
  return (
    <header className="shead">
      <div className="shead__label">
        <Label num={index}>{label}</Label>
      </div>
      <h2 className="h2 shead__title" data-split="chars">
        {title}
      </h2>
      {lead ? (
        <p className="lead shead__lead" data-split="lines" data-delay="0.15">
          {lead}
        </p>
      ) : null}
      <span className="rule" data-reveal="line" />
    </header>
  );
}

export function StatusTag({ status, dict }: { status: ProjectMeta["status"]; dict: Dictionary }) {
  return (
    <span className={`status status--${status}`}>
      <i aria-hidden="true" />
      {status === "live" ? dict.common.statusLive : dict.common.statusDemo}
    </span>
  );
}

/** A project screenshot inside a browser frame. */
export function ProjectFrame({ project, alt, priority }: { project: ProjectMeta; alt: string; priority?: boolean }) {
  return (
    <div className="frame">
      <div className="frame__bar" aria-hidden="true">
        <span className="frame__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="frame__host">{project.host}</span>
      </div>
      <div className="frame__view">
        <Image
          src={asset(project.image)}
          alt={alt}
          width={800}
          height={505}
          sizes="(max-width: 900px) 92vw, 60vw"
          priority={priority}
          className="frame__img"
          data-img
        />
        <span className="frame__scan" aria-hidden="true" />
      </div>
    </div>
  );
}

export function ProjectCard({
  project,
  locale,
  dict,
  index,
}: {
  project: ProjectMeta;
  locale: Locale;
  dict: Dictionary;
  index: number;
}) {
  const t = dict.projects[project.slug];
  return (
    <article className="pcard">
      <TLink href={`/${locale}/work/${project.slug}`} className="pcard__link" data-cursor data-cursor-label={dict.common.open}>
        <div className="pcard__media" data-reveal="clip">
          <div className="pcard__tilt" data-tilt>
            <ProjectFrame project={project} alt={`${t.title} — ${t.category}`} />
          </div>
        </div>
        <div className="pcard__meta">
          <span className="pcard__num">{String(index + 1).padStart(2, "0")}</span>
          <StatusTag status={project.status} dict={dict} />
          <span className="pcard__cat">{t.category}</span>
        </div>
        <h3 className="pcard__title">{t.title}</h3>
        <p className="pcard__sum">{t.summary}</p>
        <ul className="tags" aria-label={dict.common.platforms}>
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </TLink>
    </article>
  );
}

/** Endless band of words; scroll velocity pushes and skews it. */
export function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const row = (hidden: boolean) => (
    <span className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span className="marquee__item" key={i}>
          {i % 2 ? <em>{item}</em> : item}
          <i aria-hidden="true" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="marquee" data-marquee={reverse ? "-1" : "1"}>
      <div className="marquee__inner">
        {row(false)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}

export function CtaBlock({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.home.cta;
  return (
    <section className="cta">
      <div className="cta__flutes" aria-hidden="true" data-parallax="0.2" />
      <Label>{t.label}</Label>
      <h2 className="display cta__title" data-split="chars">
        <TitleLines lines={t.title} />
      </h2>
      <p className="lead cta__text" data-split="lines">
        {t.text}
      </p>
      <div className="cta__actions" data-reveal="stagger">
        <ButtonLink href={`/${locale}/contact`}>{t.button}</ButtonLink>
        <ButtonLink href={site.telegramUrl} variant="ghost" external externalLabel={dict.a11y.external}>
          {dict.common.writeTelegram}
        </ButtonLink>
      </div>
    </section>
  );
}

export function Meander() {
  return (
    <svg className="meander" viewBox="0 0 480 16" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-draw="">
      <path
        fill="none"
        stroke="currentColor"
        d={Array.from({ length: 20 }, (_, i) => {
          const x = i * 24;
          return `M${x} 15 V1 H${x + 18} V11 H${x + 6} V6 H${x + 12}`;
        }).join(" ")}
      />
    </svg>
  );
}
