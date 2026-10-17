import type { ReactNode } from 'react';
import type { ServiceId } from '../content/services';
import styles from './ServiceVisual.module.css';

/**
 * One drawn motif per service, built from the same line language as the robot:
 * thin ice lines, graphite planes, and a single blue element where the "sensor" looks.
 */
export function ServiceVisual({ id, className }: { id: ServiceId; className?: string }) {
  return (
    <svg
      className={`${styles.visual} ${className ?? ''}`}
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {VISUALS[id]}
    </svg>
  );
}

const VISUALS: Record<ServiceId, ReactNode> = {
  // Structure becoming product: wireframe planes resolve into a solid page.
  websites: (
    <g className={styles.stack}>
      <rect x="64" y="20" width="132" height="92" rx="4" className={styles.line} />
      <rect x="52" y="32" width="132" height="92" rx="4" className={styles.line} />
      <g className={styles.front}>
        <rect x="40" y="44" width="132" height="92" rx="4" className={styles.plane} />
        <path d="M40 58h132" className={styles.line} />
        <circle cx="48" cy="51" r="2" className={styles.dot} />
        <circle cx="55" cy="51" r="2" className={styles.dot} />
        <rect x="52" y="70" width="70" height="8" rx="1" className={styles.solid} />
        <rect x="52" y="84" width="96" height="4" rx="1" className={styles.dim} />
        <rect x="52" y="93" width="80" height="4" rx="1" className={styles.dim} />
        <rect x="52" y="110" width="40" height="12" rx="2" className={styles.accent} />
      </g>
    </g>
  ),
  // Conversation folding into a mechanism: messages feed a node graph.
  'telegram-bots': (
    <g>
      <rect x="28" y="28" width="64" height="18" rx="9" className={styles.plane} />
      <rect x="48" y="54" width="56" height="18" rx="9" className={styles.line} />
      <rect x="28" y="80" width="72" height="18" rx="9" className={styles.plane} />
      <rect x="44" y="106" width="48" height="18" rx="9" className={styles.line} />
      <path
        d="M108 63 L140 50 M108 63 L140 80 M140 50 L176 40 M140 50 L176 72 M140 80 L176 72 M140 80 L176 112 M176 72 L208 80"
        className={`${styles.line} ${styles.flow}`}
      />
      <circle cx="140" cy="50" r="6" className={styles.plane} />
      <circle cx="140" cy="80" r="6" className={styles.plane} />
      <circle cx="176" cy="40" r="5" className={styles.line} />
      <circle cx="176" cy="72" r="8" className={styles.accent} />
      <circle cx="176" cy="112" r="5" className={styles.line} />
      <circle cx="208" cy="80" r="5" className={styles.line} />
    </g>
  ),
  // An app unfolding from a phone-sized frame.
  'mini-apps': (
    <g>
      <rect x="92" y="14" width="56" height="132" rx="10" className={styles.line} />
      <rect x="99" y="30" width="42" height="26" rx="3" className={styles.plane} />
      <rect x="99" y="62" width="42" height="6" rx="1" className={styles.dim} />
      <rect x="99" y="73" width="30" height="6" rx="1" className={styles.dim} />
      <rect x="99" y="124" width="42" height="12" rx="3" className={styles.accent} />
      <g className={styles.slideLeft}>
        <rect x="30" y="40" width="50" height="34" rx="4" className={styles.plane} />
        <rect x="38" y="82" width="42" height="34" rx="4" className={styles.line} />
      </g>
      <g className={styles.slideRight}>
        <rect x="160" y="34" width="50" height="40" rx="4" className={styles.line} />
        <rect x="160" y="82" width="42" height="28" rx="4" className={styles.plane} />
      </g>
    </g>
  ),
  // A monogram assembled from precise geometric fragments.
  branding: (
    <g>
      <rect x="78" y="22" width="22" height="116" className={styles.plane} />
      <path d="M100 22h30a28 28 0 0 1 0 56h-30" className={styles.line} />
      <path d="M100 78h36a30 30 0 0 1 0 60h-36" className={styles.line} />
      <rect x="104" y="72" width="44" height="12" className={styles.accent} />
      <circle cx="184" cy="40" r="14" className={`${styles.line} ${styles.orbit}`} />
      <path d="M40 120h28M40 128h18" className={styles.line} />
    </g>
  ),
  // Modular blocks locking together like engineered components.
  // A storefront: product grid resolving into a single lit checkout action.
  'online-stores': (
    <g>
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <g key={`${col}-${row}`}>
            <rect
              x={40 + col * 56}
              y={20 + row * 56}
              width="48"
              height="36"
              rx="3"
              className={(col + row) % 2 ? styles.line : styles.plane}
            />
            <rect
              x={40 + col * 56}
              y={60 + row * 56}
              width="30"
              height="4"
              rx="1"
              className={styles.dim}
            />
          </g>
        )),
      )}
      <path d="M212 40 v84" className={styles.line} />
      <rect x="160" y="132" width="48" height="12" rx="2" className={styles.accent} />
      <path d="M40 138 h100" className={`${styles.line} ${styles.flow}`} />
    </g>
  ),
  // Two devices, one product: an app shared across platforms.
  'mobile-apps': (
    <g>
      <g className={styles.slideLeft}>
        <rect x="62" y="22" width="52" height="112" rx="10" className={styles.line} />
        <rect x="70" y="40" width="36" height="30" rx="3" className={styles.plane} />
        <rect x="70" y="78" width="28" height="5" rx="1" className={styles.dim} />
        <rect x="70" y="88" width="20" height="5" rx="1" className={styles.dim} />
      </g>
      <g className={styles.slideRight}>
        <rect x="126" y="34" width="52" height="112" rx="10" className={styles.plane} />
        <rect x="134" y="52" width="36" height="5" rx="1" className={styles.dim} />
        <rect x="134" y="62" width="24" height="5" rx="1" className={styles.dim} />
        <circle cx="152" cy="104" r="12" className={styles.line} />
        <rect x="134" y="128" width="36" height="8" rx="2" className={styles.accent} />
      </g>
    </g>
  ),
};
