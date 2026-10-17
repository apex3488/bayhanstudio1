import { usePage } from '../app/PageContext';
import { ArrowIcon } from '../components/ArrowIcon';
import { ExternalLink } from '../components/ExternalLink';
import { PageIntro } from '../components/PageIntro';
import { contacts } from '../content/contacts';
import { BriefForm } from '../features/brief-form/BriefForm';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  const { t } = usePage();
  const channels = [
    { label: t.footer.telegram, handle: '@APEX348', href: contacts.telegram },
    { label: t.footer.instagram, handle: '@bayhan_studio01', href: contacts.instagram },
    { label: t.footer.channel, handle: '@Bayhan_studio', href: contacts.telegramChannel },
  ];

  return (
    <>
      <PageIntro
        label={t.contactPage.label}
        title={t.contactPage.title}
        lead={t.contactPage.intro}
      />
      <div className={`shell grid ${styles.body}`}>
        <div className={styles.form}>
          <BriefForm />
        </div>
        <aside className={styles.aside} aria-labelledby="direct-heading">
          <h2 id="direct-heading" className={styles.asideHeading}>
            {t.contactPage.directHeading}
          </h2>
          <p className={styles.asideText}>{t.contactPage.directText}</p>
          <ul className={styles.channels}>
            {channels.map((channel) => (
              <li key={channel.href}>
                <ExternalLink className={styles.channel} href={channel.href}>
                  <span>
                    <span className={styles.channelName}>{channel.label}</span>
                    <span className={styles.channelHandle}>{channel.handle}</span>
                  </span>
                  <ArrowIcon direction="external" />
                </ExternalLink>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
