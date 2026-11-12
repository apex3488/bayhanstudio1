import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";
import { numerals, projects, serviceIds } from "@/content/data";
import SceneCanvas from "@/components/SceneCanvas";
import Plate, { CanonFigure } from "@/components/Plate";
import { TLink } from "@/components/Experience";
import Rail from "@/components/Rail";
import { ButtonLink, CtaBlock, Label, Marquee, ProjectFrame, SectionHead, StatusTag, TitleLines } from "@/components/ui";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMeta(locale, "", dict.meta.home);
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.home;
  const serviceNames = serviceIds.map((id) => dict.services.items[id].name);

  return (
    <>
      {/* I — the Oracle: hero and manifesto share one scene */}
      <div className="stage" data-stage>
        <SceneCanvas
          scene="oracle"
          className="stage__scene"
          label={dict.a11y.scenes.oracle}
          fallback={<Plate kind="tholos" draw={false} />}
        />
        <section className="hero">
          <span className="hero__corner hero__corner--tl" aria-hidden="true" />
          <span className="hero__corner hero__corner--br" aria-hidden="true" />
          <p className="label hero__kicker" data-reveal data-hero>
            <span className="hero__brand">BAYHAN STUDIO</span>
            <span data-scramble>{t.hero.kicker}</span>
          </p>
          <h1 className="hero__title" data-split="chars" data-hero data-delay="0.1">
            <TitleLines lines={t.hero.title} />
          </h1>
          <div className="hero__foot">
            <p className="lead hero__sub" data-split="lines" data-hero data-delay="0.75">
              {t.hero.sub}
            </p>
            <div className="hero__cta" data-reveal="stagger" data-hero data-delay="1.05">
              <ButtonLink href={`/${locale}/services`}>{t.hero.cta1}</ButtonLink>
              <ButtonLink href={site.telegramUrl} variant="ghost" external externalLabel={dict.a11y.external}>
                {t.hero.cta2}
              </ButtonLink>
            </div>
          </div>
          {/* three facts, all countable on this site */}
          <dl className="hero__stats" data-reveal="stagger" data-hero data-delay="1.3">
            <div>
              <dt>{dict.nav.services}</dt>
              <dd data-count={serviceIds.length}>{pad(serviceIds.length)}</dd>
            </div>
            <div>
              <dt>{dict.nav.work}</dt>
              <dd data-count={projects.length}>{pad(projects.length)}</dd>
            </div>
            <div>
              <dt>{dict.menu.lang}</dt>
              <dd className="hero__langs">{locales.map((l) => l.toUpperCase()).join(" · ")}</dd>
            </div>
          </dl>
          <p className="hero__scroll label" data-reveal data-hero data-delay="1.5" aria-hidden="true">
            <i />
            {dict.common.scroll}
          </p>
        </section>

        <section className="manifesto" aria-labelledby="manifesto-label">
          <Label num={0} id="manifesto-label">
            {t.manifesto.label}
          </Label>
          <p className="manifesto__text" data-scrub>
            {t.manifesto.text}
          </p>
        </section>
      </div>

      <Marquee items={serviceNames} />

      {/* II — the order of services */}
      <section className="section order">
        <SectionHead index={1} label={t.services.label} title={t.services.title} lead={t.services.lead} />
        <ul className="order__list" data-follow>
          {serviceIds.map((id, i) => {
            const s = dict.services.items[id];
            return (
              <li key={id} className="order__item" data-reveal>
                <TLink href={`/${locale}/services#${id}`} className="order__row" data-cursor>
                  <span className="order__num">{numerals[i]}</span>
                  <span className="order__name">{s.name}</span>
                  <span className="order__short">{s.short}</span>
                  <span className="order__plate" aria-hidden="true">
                    <Plate kind={id} draw={false} />
                  </span>
                  <span className="order__arrow" aria-hidden="true">
                    →
                  </span>
                </TLink>
              </li>
            );
          })}
        </ul>
        <div className="section__foot" data-reveal>
          <ButtonLink href={`/${locale}/services`} variant="ghost">
            {dict.common.allServices}
          </ButtonLink>
        </div>
      </section>

      {/* III — the Canon: a façade raised in four stages */}
      <section className="canon" data-canon aria-labelledby="canon-title">
        <div className="canon__pin">
          <header className="canon__head">
            <Label num={2}>{t.canon.label}</Label>
            <h2 className="h2" id="canon-title">
              {t.canon.title}
            </h2>
            <ol className="canon__marks" aria-hidden="true">
              {t.canon.steps.map((s, i) => (
                <li key={s.name} className="canon__mark">
                  {numerals[i]} · {s.name}
                </li>
              ))}
            </ol>
          </header>
          <div className="canon__body">
            <ol className="canon__steps">
              {t.canon.steps.map((s, i) => (
                <li key={s.name} className="canon__step">
                  <span className="canon__numeral" aria-hidden="true">
                    {numerals[i]}
                  </span>
                  <p className="label">{s.name}</p>
                  <h3 className="h3">{s.title}</h3>
                  <p className="lead">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="canon__figure">
              <CanonFigure label={t.canon.title} />
            </div>
          </div>
          <div className="canon__bar" aria-hidden="true">
            <i />
          </div>
        </div>
      </section>

      {/* IV — work: a carousel of live projects (drag, arrows, keys, swipe) */}
      <section className="gallery" aria-labelledby="gallery-title">
        <div className="gallery__glow" aria-hidden="true" data-parallax="0.3" />
        <header className="gallery__head">
          <div>
            <Label num={3}>{t.work.label}</Label>
            <h2 className="h2" id="gallery-title" data-split="chars">
              {t.work.title}
            </h2>
          </div>
          <p className="lead gallery__lead" data-split="lines">
            {t.work.lead}
          </p>
        </header>
        <div data-reveal>
          <Rail count={projects.length} labels={{ prev: dict.a11y.prev, next: dict.a11y.next, region: dict.a11y.carousel }}>
            {projects.map((p, i) => {
              const pt = dict.projects[p.slug];
              return (
                <li key={p.slug} className="slide">
                  <TLink
                    href={`/${locale}/work/${p.slug}`}
                    className="slide__link"
                    draggable={false}
                    data-cursor
                    data-cursor-label={dict.common.open}
                  >
                    <span className="slide__num" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                    <div className="slide__media">
                      <ProjectFrame project={p} alt={`${pt.title} — ${pt.category}`} />
                    </div>
                    <div className="slide__info">
                      <div className="slide__meta">
                        <StatusTag status={p.status} dict={dict} />
                        <span className="label">{pt.category}</span>
                      </div>
                      <h3 className="slide__title">{pt.title}</h3>
                      <p className="slide__sum">{pt.summary}</p>
                      <ul className="tags" aria-label={dict.common.platforms}>
                        {p.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    </div>
                  </TLink>
                </li>
              );
            })}
            <li className="slide slide--end">
              <TLink href={`/${locale}/work`} className="slide__all" draggable={false} data-cursor data-magnetic>
                <span className="display display--sm">{dict.common.allWork}</span>
                <span className="slide__all-arrow" aria-hidden="true">
                  →
                </span>
              </TLink>
            </li>
          </Rail>
        </div>
      </section>

      {/* V — principles */}
      <section className="section principles">
        <SectionHead index={4} label={t.principles.label} title={t.principles.title} />
        <ol className="principles__list" data-reveal="stagger">
          {t.principles.items.map((p, i) => (
            <li key={p.title} className="principle" data-tilt>
              <span className="principle__num">{numerals[i]}</span>
              <h3 className="h3">{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Marquee items={["BAYHAN STUDIO", ...t.cta.title, "BAYHAN STUDIO", t.cta.button]} reverse />

      <CtaBlock locale={locale} dict={dict} />
    </>
  );
}
