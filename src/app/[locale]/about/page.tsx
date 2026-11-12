import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { numerals } from "@/content/data";
import SceneCanvas from "@/components/SceneCanvas";
import Plate from "@/components/Plate";
import { ButtonLink, Meander, SectionHead, TitleLines } from "@/components/ui";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMeta(locale, "/about", dict.meta.about);
}

export default async function AboutPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.about;

  return (
    <>
      <div className="stage stage--about" data-stage>
        <SceneCanvas
          scene="colonnade"
          className="stage__scene"
          label={dict.a11y.scenes.colonnade}
          fallback={<Plate kind="web" draw={false} />}
        />
        <section className="phero phero--scene">
          <p className="label" data-reveal data-hero>
            {t.hero.label}
          </p>
          <h1 className="display" data-split="chars" data-hero data-delay="0.1">
            <TitleLines lines={t.hero.title} />
          </h1>
          <p className="lead phero__lead" data-split="lines" data-hero data-delay="0.7">
            {t.hero.lead}
          </p>
        </section>
        <section className="manifesto manifesto--center" aria-label={t.story.label}>
          <p className="label">
            <span className="shead__num">{numerals[0]}</span>
            {t.story.label}
          </p>
          <p className="manifesto__text" data-scrub>
            {t.story.paragraphs[0]}
          </p>
        </section>
      </div>

      <section className="section story">
        <div className="story__grid">
          <div className="story__aside">
            <p className="label" data-reveal>
              <span className="shead__num">{numerals[1]}</span>
              {t.story.label}
            </p>
            <h2 className="h2" data-split="lines">
              {t.story.title}
            </h2>
          </div>
          <div className="story__body">
            {t.story.paragraphs.slice(1).map((p) => (
              <p key={p.slice(0, 24)} className="story__p" data-split="lines">
                {p}
              </p>
            ))}
            <div className="story__plate" data-reveal="clip">
              <div>
                <Plate kind="design" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section approach">
        <SectionHead index={2} label={t.approach.label} title={t.approach.title} />
        <ol className="approach__list" data-reveal="stagger">
          {t.approach.items.map((item, i) => (
            <li key={item.title} className="approach__item">
              <span className="approach__num">{numerals[i]}</span>
              <h3 className="h3">{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section limits">
        <Meander />
        <div className="limits__grid">
          <div>
            <p className="label" data-reveal>
              <span className="shead__num">{numerals[3]}</span>
              {t.not.label}
            </p>
            <h2 className="h2" data-split="lines">
              {t.not.title}
            </h2>
          </div>
          <ul className="limits__list" data-reveal="stagger">
            {t.not.items.map((item) => (
              <li key={item}>
                <span className="limits__x" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cta cta--compact">
        <h2 className="h2 cta__title" data-split="lines">
          {t.cta.title}
        </h2>
        <div className="cta__actions" data-reveal="stagger">
          <ButtonLink href={`/${locale}/contact`}>{t.cta.button}</ButtonLink>
        </div>
      </section>
    </>
  );
}
