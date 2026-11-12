import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";
import { numerals, serviceIds } from "@/content/data";
import SceneCanvas from "@/components/SceneCanvas";
import ContactForm from "@/components/ContactForm";
import Plate from "@/components/Plate";
import { TitleLines } from "@/components/ui";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMeta(locale, "/contact", dict.meta.contact);
}

export default async function ContactPage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.contact;

  // The form talks to the server route only when it is actually configured.
  const apiEnabled = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  const channels = [
    { ...t.channels.telegram, href: site.telegramUrl, handle: site.telegramHandle },
    { ...t.channels.channel, href: site.channelUrl, handle: site.channelHandle },
    { ...t.channels.instagram, href: site.instagramUrl, handle: site.instagramHandle },
  ];

  return (
    <>
      <div className="stage stage--contact" data-stage>
        <SceneCanvas
          scene="portal"
          className="stage__scene"
          label={dict.a11y.scenes.portal}
          fallback={<Plate kind="web" draw={false} />}
        />
        <section className="phero phero--scene">
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
      </div>

      <section className="section channels" aria-labelledby="channels-label">
        <p className="label" id="channels-label" data-reveal>
          <span className="shead__num">{numerals[0]}</span>
          {t.channels.label}
        </p>
        <ul className="channels__list">
          {channels.map((c) => (
            <li key={c.href} data-reveal>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="channel" data-cursor>
                <span className="channel__name">{c.name}</span>
                <span className="channel__handle">{c.handle}</span>
                <span className="channel__desc">{c.desc}</span>
                <span className="channel__arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> — {dict.a11y.external}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="section brief" aria-labelledby="brief-title">
        <div className="brief__grid">
          <div className="brief__aside">
            <p className="label" data-reveal>
              <span className="shead__num">{numerals[1]}</span>
              {t.form.label}
            </p>
            <h2 className="h2" id="brief-title" data-split="lines">
              {t.form.title}
            </h2>
            <div className="brief__plate" data-reveal="clip">
              <div>
                <Plate kind="bots" />
              </div>
            </div>
          </div>
          <div className="brief__form" data-reveal>
            <ContactForm
              t={t.form}
              services={serviceIds.map((id) => dict.services.items[id].name)}
              locale={locale}
              telegramUrl={site.telegramUrl}
              apiEnabled={apiEnabled}
            />
          </div>
        </div>
      </section>
    </>
  );
}
