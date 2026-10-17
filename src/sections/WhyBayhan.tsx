import { useRef } from 'react';
import { usePage } from '../app/PageContext';
import { Label } from '../components/Label';
import { useReveal } from '../motion/useReveal';
import styles from './WhyBayhan.module.css';

/** Editorial spread: one statement against four working principles. */
export function WhyBayhan() {
  const { t } = usePage();
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section ref={root} className={`shell grid ${styles.section}`} aria-labelledby="why-heading">
      <div className={styles.head}>
        <div data-reveal>
          <Label index="04">{t.why.label}</Label>
        </div>
        <h2 id="why-heading" className={styles.title} data-reveal="1">
          {t.why.title}
        </h2>
      </div>
      <ul className={styles.list}>
        {t.why.items.map((item, i) => (
          <li key={item.title} className={styles.item} data-reveal={String(i)}>
            <h3 className={styles.itemTitle}>{item.title}</h3>
            <p className={styles.itemText}>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
