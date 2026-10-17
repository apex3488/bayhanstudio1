import { useRef, type ComponentType } from 'react';
import { usePage } from '../app/PageContext';
import { contactHref, href } from '../app/paths';
import { serviceRouteId } from '../app/routeIds';
import { ArrowIcon } from '../components/ArrowIcon';
import { ButtonLink } from '../components/ButtonLink';
import { Label } from '../components/Label';
import { PageIntro } from '../components/PageIntro';
import { ServiceVisual } from '../components/ServiceVisual';
import { contacts } from '../content/contacts';
import { serviceIds, type ServiceId } from '../content/services';
import { useReveal } from '../motion/useReveal';
import { ContactCta } from '../sections/ContactCta';
import { Process } from '../sections/Process';
import styles from './ServiceDetailPage.module.css';

function ServiceDetailPage({ id }: { id: ServiceId }) {
  const { locale, t } = usePage();
  const body = useRef<HTMLDivElement>(null);
  useReveal(body);

  const copy = t.services.items[id];
  const position = serviceIds.indexOf(id);
  const nextId = serviceIds[(position + 1) % serviceIds.length] ?? serviceIds[0];

  return (
    <>
      <PageIntro
        label={`${t.servicePage.label} 0${position + 1} / 0${serviceIds.length}`}
        title={copy.name}
        lead={copy.description}
      >
        <ButtonLink href={contactHref(locale, id)} size="l" magnetic>
          {copy.cta}
        </ButtonLink>
        <ButtonLink href={contacts.telegram} size="l" variant="secondary" external>
          {t.hero.ctaTelegram}
        </ButtonLink>
      </PageIntro>

      <div ref={body} className={`shell grid ${styles.body}`}>
        <div className={styles.visual} data-reveal>
          <ServiceVisual id={id} />
        </div>

        <section className={styles.includes} aria-labelledby="includes-heading">
          <h2 id="includes-heading" className={styles.heading} data-reveal>
            <Label as="span" index="01">
              {t.servicePage.includesHeading}
            </Label>
          </h2>
          <ul className={styles.includeList}>
            {copy.includes.map((item, i) => (
              <li key={item} data-reveal={String(i)}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.value} aria-labelledby="value-heading">
          <h2 id="value-heading" className={styles.heading} data-reveal>
            <Label as="span" index="02">
              {t.servicePage.valueHeading}
            </Label>
          </h2>
          <p className={styles.valueText} data-reveal="1">
            {copy.value}
          </p>
        </section>
      </div>

      <Process index="03" />

      <nav className={`shell ${styles.nextNav}`} aria-label={t.servicePage.nextService}>
        <a className={styles.next} href={href(serviceRouteId(nextId), locale)}>
          <span className={styles.nextLabel}>{t.servicePage.nextService}</span>
          <span className={styles.nextName}>
            {t.services.items[nextId].name}
            <ArrowIcon />
          </span>
        </a>
        <a className={styles.all} href={href('services', locale)}>
          {t.servicePage.allServices}
        </a>
      </nav>

      <ContactCta index="04" type={id} />
    </>
  );
}

/** One prerenderable component per service route. */
export function servicePageFor(id: ServiceId): ComponentType {
  function ServicePage() {
    return <ServiceDetailPage id={id} />;
  }
  ServicePage.displayName = `ServicePage(${id})`;
  return ServicePage;
}
