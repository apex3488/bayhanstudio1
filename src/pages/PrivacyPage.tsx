import { usePage } from '../app/PageContext';
import { PageIntro } from '../components/PageIntro';
import styles from './PrivacyPage.module.css';

export default function PrivacyPage() {
  const { t } = usePage();
  return (
    <>
      <PageIntro label={t.privacy.label} title={t.privacy.title} lead={t.privacy.updated} />
      <div className={`shell ${styles.body}`}>
        {t.privacy.sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.heading}>{section.title}</h2>
            <p className={styles.text}>{section.text}</p>
          </section>
        ))}
      </div>
    </>
  );
}
