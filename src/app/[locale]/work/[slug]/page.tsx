import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMeta } from "@/lib/meta";
import { getProject, projects } from "@/content/data";
import { TLink } from "@/components/Experience";
import { ButtonLink, CtaBlock, ProjectFrame, StatusTag } from "@/components/ui";

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(locale) || !project) return {};
  const dict = await getDictionary(locale);
  const t = dict.projects[project.slug];
  return pageMeta(locale, `/work/${slug}`, {
    title: `${t.title} — ${t.category} — BAYHAN STUDIO`,
    description: t.summary,
  });
}

export default async function ProjectPage({ params }: Params) {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(locale) || !project) notFound();
  const dict = await getDictionary(locale);
  const t = dict.projects[project.slug];
  const p = dict.projectPage;
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const nextT = dict.projects[next.slug];

  return (
    <>
      <article className="project">
        <header className="phero phero--project">
          <TLink href={`/${locale}/work`} className="backlink" data-reveal data-hero>
            <span aria-hidden="true">←</span> {p.back}
          </TLink>
          <div className="project__tags" data-reveal data-hero data-delay="0.1">
            <span className="project__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
            <StatusTag status={project.status} dict={dict} />
            <span className="label">{t.category}</span>
          </div>
          <h1 className="display display--sm" data-split="chars" data-hero data-delay="0.15">
            {t.title}
          </h1>
          <div className="project__intro">
            <p className="lead phero__lead" data-split="lines" data-hero data-delay="0.7">
              {t.summary}
            </p>
            <div data-reveal data-hero data-delay="0.95">
              <ButtonLink href={project.url} external externalLabel={dict.a11y.external}>
                {dict.common.visit}
              </ButtonLink>
            </div>
          </div>
        </header>

        <div className="project__shot" data-reveal="clip" data-hero data-delay="0.5">
          <div className="project__shot-inner" data-tilt>
            <ProjectFrame project={project} alt={`${t.title} — ${t.category}`} priority />
          </div>
        </div>

        <div className="project__body">
          <aside className="project__passport" data-reveal>
            <dl>
              <div>
                <dt>{dict.common.type}</dt>
                <dd>{t.category}</dd>
              </div>
              <div>
                <dt>{dict.common.platforms}</dt>
                <dd>{project.tags.join(" · ")}</dd>
              </div>
              <div>
                <dt>{dict.common.status}</dt>
                <dd>{project.status === "live" ? dict.common.statusLive : dict.common.statusDemo}</dd>
              </div>
              <div>
                <dt>{dict.common.link}</dt>
                <dd>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="ulink">
                    {project.host}
                    <span className="sr-only"> — {dict.a11y.external}</span>
                  </a>
                </dd>
              </div>
            </dl>
          </aside>

          <div className="project__text">
            <section>
              <h2 className="label">
                <span data-scramble>{p.about}</span>
              </h2>
              <p className="project__big" data-scrub>
                {t.about}
              </p>
            </section>
            <section>
              <h2 className="label">
                <span data-scramble>{p.features}</span>
              </h2>
              <ul className="ticks ticks--lg" data-reveal="stagger">
                {t.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>

      <nav className="nextp" aria-label={p.next}>
        <TLink href={`/${locale}/work/${next.slug}`} className="nextp__link" data-cursor data-cursor-label={dict.common.open}>
          <span className="label">{p.next}</span>
          <span className="display nextp__title">{nextT.title}</span>
          <span className="nextp__meta">
            <StatusTag status={next.status} dict={dict} />
            <span className="label">{nextT.category}</span>
          </span>
        </TLink>
      </nav>

      <CtaBlock locale={locale} dict={dict} />
    </>
  );
}
