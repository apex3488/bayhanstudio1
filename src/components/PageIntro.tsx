import { useRef, type ReactNode } from 'react';
import { useReveal } from '../motion/useReveal';
import { Label } from './Label';
import styles from './PageIntro.module.css';

interface PageIntroProps {
  label: string;
  index?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}

/** Opening block of inner pages: label, the page's single h1, lead and actions. */
export function PageIntro({ label, index, title, lead, children }: PageIntroProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <header ref={root} className={`shell ${styles.intro}`}>
      <div data-reveal>
        <Label index={index} tone="accent">
          {label}
        </Label>
      </div>
      <h1 className={styles.title} data-reveal="1">
        {title}
      </h1>
      {lead && (
        <p className={styles.lead} data-reveal="2">
          {lead}
        </p>
      )}
      {children && (
        <div className={styles.extra} data-reveal="3">
          {children}
        </div>
      )}
    </header>
  );
}
