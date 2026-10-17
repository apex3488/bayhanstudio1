import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { href } from '../app/paths';
import { serviceRouteId } from '../app/routeIds';
import { ArrowIcon } from '../components/ArrowIcon';
import { PageIntro } from '../components/PageIntro';
import { ServiceVisual } from '../components/ServiceVisual';
import { serviceIds } from '../content/services';
import { useReveal } from '../motion/useReveal';
import { ContactCta } from '../sections/ContactCta';
import { Process } from '../sections/Process';
import styles from './ServicesPage.module.css';

export default function ServicesPage() {
  const { locale, t } = usePage();
  const list = useRef<HTMLOListElement>(null);
  useReveal(list);

  return (
    <>
      <PageIntro label={t.services.label} title={t.services.title} lead={t.services.intro} />

      <ol ref={list} className={`shell ${styles.list}`}>
        {serviceIds.map((id, index) => {
          const copy = t.services.items[id];
          return (
            <li key={id} data-reveal>
              <a className={styles.row} href={href(serviceRouteId(id), locale)}>
                <span className={styles.index} aria-hidden="true">
                  0{index + 1}
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{copy.name}</span>
                  <span className={styles.short}>{copy.short}</span>
                </span>
                <ServiceVisual id={id} className={styles.visual} />
                <span className={styles.arrow}>
                  <ArrowIcon />
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      <Process index="02" />
      <ContactCta index="03" />
    </>
  );
}
