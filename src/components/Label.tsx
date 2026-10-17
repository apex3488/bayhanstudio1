import type { ReactNode } from 'react';
import styles from './Label.module.css';

interface LabelProps {
  children: ReactNode;
  /** Optional index shown before the text, e.g. "01". */
  index?: string;
  /** Accent marks the single "lit" label of a section. */
  tone?: 'accent' | 'muted';
  as?: 'p' | 'span';
}

/** Small uppercase technical annotation above headings and blocks. */
export function Label({ children, index, tone = 'muted', as: Tag = 'p' }: LabelProps) {
  return (
    <Tag className={`${styles.label} ${styles[tone]}`}>
      {index && <span className={styles.index}>{index}</span>}
      {children}
    </Tag>
  );
}
