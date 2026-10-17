import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { contactHref } from '../app/paths';
import { ArrowIcon } from '../components/ArrowIcon';
import { ButtonLink } from '../components/ButtonLink';
import { ExternalLink } from '../components/ExternalLink';
import { Label } from '../components/Label';
import { contacts } from '../content/contacts';
import { sound } from '../features/sound/engine';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { media } from '../motion/tokens';
import { useReveal } from '../motion/useReveal';
import styles from './Finale.module.css';

/**
 * The closing scene: the 3D head returns and faces the visitor (driven by
 * data-scene="finale"), the headline assembles line by line, and the three real
 * channels are set at display size.
 */
export function Finale() {
  const { locale, t } = usePage();
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useReveal(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(media.motion, () => {
        if (!title.current) return;
        const split = SplitText.create(title.current, { type: 'lines', mask: 'lines' });
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: title.current, start: 'top 80%', once: true },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const channels = [
    { label: t.footer.telegram, handle: '@APEX348', href: contacts.telegram },
    { label: t.footer.instagram, handle: '@bayhan_studio01', href: contacts.instagram },
    { label: t.footer.channel, handle: '@Bayhan_studio', href: contacts.telegramChannel },
  ];

  return (
    <section
      ref={root}
      className={styles.section}
      aria-labelledby="finale-heading"
      data-scene="finale"
    >
      <div className={`shell ${styles.inner}`}>
        <div data-reveal>
          <Label index="06" tone="accent">
            {t.contactCta.label}
          </Label>
        </div>
        <h2 id="finale-heading" ref={title} className={styles.title}>
          {t.contactCta.title}
        </h2>
        <div className={styles.lead} data-reveal>
          <p>{t.contactCta.text}</p>
          <ButtonLink href={contactHref(locale)} size="l" magnetic>
            {t.contactCta.primary}
          </ButtonLink>
        </div>

        <nav className={styles.channels} aria-labelledby="finale-channels">
          <h3 id="finale-channels" className="visually-hidden">
            {t.contactCta.channelsHeading}
          </h3>
          <ul>
            {channels.map((channel, i) => (
              <li key={channel.href} data-reveal={String(i)}>
                <ExternalLink
                  className={styles.channel}
                  href={channel.href}
                  onPointerEnter={() => sound.play('hover')}
                  onClick={() => sound.play('tick')}
                >
                  <span className={styles.channelName}>{channel.label}</span>
                  <span className={styles.channelHandle}>{channel.handle}</span>
                  <span className={styles.channelArrow}>
                    <ArrowIcon direction="external" />
                  </span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
