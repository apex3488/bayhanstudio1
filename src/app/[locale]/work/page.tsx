import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";
import { projects } from "@/content/data";
import { ButtonLink, CtaBlock, Label, Marquee, ProjectCard, TitleLines } from "@/components/ui";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMeta(locale, "/work", dict.meta.work);
}

export default async function WorkPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.work;

  return (
    <>
      <section className="phero">
        <Label>{t.hero.label}</Label>
        <h1 className="display" data-split="chars" data-hero data-delay="0.1">
          <TitleLines lines={t.hero.title} />
        </h1>
        <p className="lead phero__lead" data-split="lines" data-hero data-delay="0.7">
          {t.hero.lead}
        </p>
        <p className="phero__count" aria-hidden="true">
          <span data-count={projects.length}>{String(projects.length).padStart(2, "0")}</span>
        </p>
      </section>

      <Marquee items={projects.map((p) => dict.projects[p.slug].title)} />

      <section className="section hall" aria-labelledby="hall-title">
        <header className="hall__head">
          <Label>{t.real.label}</Label>
          <h2 className="h2" id="hall-title" data-split="chars">
            {t.real.title}
          </h2>
          <p className="hall__note" data-reveal>
            {t.real.note}
          </p>
        </header>
        <div className="works__grid">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} locale={locale} dict={dict} index={i} />
          ))}
        </div>
        <div className="section__foot" data-reveal>
          <ButtonLink href={site.channelUrl} variant="ghost" external externalLabel={dict.a11y.external}>
            {t.channelLink}
          </ButtonLink>
        </div>
      </section>

      <CtaBlock locale={locale} dict={dict} />
    </>
  );
}
