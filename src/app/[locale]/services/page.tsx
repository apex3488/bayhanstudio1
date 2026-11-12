import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { numerals, serviceIds } from "@/content/data";
import SceneCanvas from "@/components/SceneCanvas";
import ServiceSpy from "@/components/ServiceSpy";
import Plate from "@/components/Plate";
import { ButtonLink, CtaBlock, SectionHead, TitleLines } from "@/components/ui";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMeta(locale, "/services", dict.meta.services);
}

export default async function ServicesPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.services;

  return (
    <>
      <section className="phero">
        <p className="label" data-reveal data-hero>
          {t.hero.label}
        </p>
        <h1 className="display display--sm" data-split="chars" data-hero data-delay="0.1">
          <TitleLines lines={t.hero.title} />
        </h1>
        <p className="lead phero__lead" data-split="lines" data-hero data-delay="0.7">
          {t.hero.lead}
        </p>
      </section>

      <div className="svc">
        <aside className="svc__scene" data-stage>
          <SceneCanvas scene="column" label={dict.a11y.scenes.column} fallback={<Plate kind="tholos" draw={false} />} />
          <ol className="svc__dots" aria-hidden="true">
            {serviceIds.map((id, i) => (
              <li key={id} data-service-dot>
                {numerals[i]}
              </li>
            ))}
          </ol>
        </aside>

        <div className="svc__list">
          {serviceIds.map((id, i) => {
            const s = t.items[id];
            return (
              <article key={id} id={id} className="service" data-service-index={i} aria-labelledby={`${id}-title`}>
                <header className="service__head">
                  <span className="service__num" aria-hidden="true">
                    {numerals[i]}
                  </span>
                  <h2 className="h2 service__title" id={`${id}-title`} data-split="lines">
                    {s.name}
                  </h2>
                </header>
                <p className="lead service__pitch" data-split="lines">
                  {s.pitch}
                </p>
                <div className="service__plate" data-reveal="clip">
                  <div>
                    <Plate kind={id} />
                  </div>
                </div>
                <div className="service__grid" data-reveal="stagger">
                  <div className="service__block">
                    <h3 className="label">{t.labels.forWhom}</h3>
                    <p>{s.forWhom}</p>
                  </div>
                  <div className="service__block service__block--wide">
                    <h3 className="label">{t.labels.includes}</h3>
                    <ul className="ticks">
                      {s.includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="service__block">
                    <h3 className="label">{t.labels.result}</h3>
                    <p>{s.result}</p>
                  </div>
                </div>
                <div data-reveal>
                  <ButtonLink href={`/${locale}/contact`} variant="ghost">
                    {t.labels.discuss}
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <ServiceSpy />

      <section className="section pricing">
        <div className="pricing__box" data-reveal>
          <p className="label">{t.pricing.label}</p>
          <h2 className="h2">{t.pricing.title}</h2>
          <p className="lead">{t.pricing.text}</p>
        </div>
      </section>

      <section className="section faq">
        <SectionHead label={t.faq.label} title={t.faq.title} />
        <div className="faq__list" data-reveal="stagger">
          {t.faq.items.map((item) => (
            <details key={item.q} className="faq__item">
              <summary>
                <span>{item.q}</span>
                <i aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaBlock locale={locale} dict={dict} />
    </>
  );
}
