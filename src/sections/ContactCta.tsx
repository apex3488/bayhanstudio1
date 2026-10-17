import { useRef, type PointerEvent } from 'react';
import { usePage } from '../app/PageContext';
import { contactHref } from '../app/paths';
import { ButtonLink } from '../components/ButtonLink';
import { Label } from '../components/Label';
import { contacts } from '../content/contacts';
import type { ServiceId } from '../content/services';
import { useReveal } from '../motion/useReveal';
import styles from './ContactCta.module.css';

/** The sensor line from the robot's visor returns here and follows the reader. */
function followSensor(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  event.currentTarget.style.setProperty('--sensor-x', `${Math.min(96, Math.max(4, x))}%`);
}

export function ContactCta({ index = '05', type }: { index?: string; type?: ServiceId }) {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section
      ref={root}
      className={`shell ${styles.section}`}
      aria-labelledby="cta-heading"
      onPointerMove={followSensor}
    >
      <div className={styles.sensor} aria-hidden="true" />
      <div data-reveal>
        <Label index={index} tone="accent">
          {t.contactCta.label}
        </Label>
      </div>
      <h2 id="cta-heading" className={styles.title} data-reveal="1">
        {t.contactCta.title}
      </h2>
      <p className={styles.text} data-reveal="2">
        {t.contactCta.text}
      </p>
      <div className={styles.actions} data-reveal="3">
        <ButtonLink href={contactHref(locale, type)} size="l" magnetic>
          {t.contactCta.primary}
        </ButtonLink>
        <ButtonLink href={contacts.telegram} size="l" variant="secondary" external>
          {t.hero.ctaTelegram}
        </ButtonLink>
      </div>
    </section>
  );
}
