import styles from './Logo.module.css';

/**
 * Typographic wordmark with a "sensor slit" mark. If official logo files are
 * provided later, this is the only place to replace.
 */
export function Logo() {
  return (
    <span className={styles.logo} aria-hidden="true">
      <svg className={styles.mark} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3h8.2a4.6 4.6 0 0 1 2.9 8.2A4.8 4.8 0 0 1 14 21H5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="8" y="11" width="9" height="2" fill="var(--c-blue)" />
      </svg>
      <span className={styles.word}>BAYHAN</span>
      <span className={styles.studio}>STUDIO</span>
    </span>
  );
}
