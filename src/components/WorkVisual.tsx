import styles from './WorkVisual.module.css';

export type WorkVisualId = 'bayhan' | 'orbit' | 'atelier';

/**
 * Interface sketches drawn over the studio's own renders. They illustrate the
 * concept studies; they are not screenshots of client products.
 */
export function WorkVisual({ id }: { id: WorkVisualId }) {
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 800 500"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {id === 'bayhan' && (
        <g>
          {/* Browser frame around the live site */}
          <rect x="70" y="60" width="660" height="380" rx="10" className={styles.frame} />
          <path d="M70 92h660" className={styles.line} />
          {[90, 104, 118].map((x) => (
            <circle key={x} cx={x} cy="76" r="4" className={styles.dot} />
          ))}
          <rect x="300" y="70" width="200" height="12" rx="6" className={styles.faint} />
          <rect x="110" y="300" width="250" height="34" rx="2" className={styles.ink} />
          <rect x="110" y="344" width="190" height="34" rx="2" className={styles.ink} />
          <rect x="110" y="396" width="110" height="20" rx="3" className={styles.accent} />
        </g>
      )}
      {id === 'orbit' && (
        <g>
          {/* Mini App: menu, pre-order time, loyalty stamps */}
          <rect x="290" y="30" width="220" height="440" rx="30" className={styles.frame} />
          <rect x="314" y="74" width="172" height="92" rx="10" className={styles.panel} />
          <circle cx="350" cy="120" r="22" className={styles.line} />
          <rect x="384" y="104" width="80" height="10" rx="3" className={styles.ink} />
          <rect x="384" y="124" width="56" height="8" rx="3" className={styles.faint} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x="314"
                y={184 + i * 52}
                width="172"
                height="40"
                rx="8"
                className={styles.panel}
              />
              <rect
                x="330"
                y={198 + i * 52}
                width={70 + i * 14}
                height="10"
                rx="3"
                className={styles.faint}
              />
              <circle
                cx="466"
                cy={204 + i * 52}
                r="8"
                className={i === 1 ? styles.accent : styles.line}
              />
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={330 + i * 28}
              cy="356"
              r="9"
              className={i < 4 ? styles.ink : styles.line}
            />
          ))}
          <rect x="314" y="404" width="172" height="40" rx="10" className={styles.accent} />
        </g>
      )}
      {id === 'atelier' && (
        <g>
          {/* Editorial storefront: collection title, product grid, short checkout */}
          <rect x="80" y="50" width="640" height="400" rx="6" className={styles.frame} />
          <rect x="112" y="86" width="230" height="40" rx="2" className={styles.ink} />
          <rect x="112" y="136" width="150" height="10" rx="3" className={styles.faint} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={112 + i * 150}
                y="176"
                width="130"
                height="170"
                rx="4"
                className={styles.panel}
              />
              <rect
                x={112 + i * 150}
                y="356"
                width="90"
                height="10"
                rx="3"
                className={styles.faint}
              />
              <rect
                x={112 + i * 150}
                y="374"
                width="50"
                height="10"
                rx="3"
                className={styles.ink}
              />
            </g>
          ))}
          <path d="M582 176v230" className={styles.line} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle
                cx="616"
                cy={200 + i * 44}
                r="10"
                className={i === 0 ? styles.accent : styles.line}
              />
              <rect
                x="636"
                y={194 + i * 44}
                width="60"
                height="10"
                rx="3"
                className={styles.faint}
              />
            </g>
          ))}
          <rect x="604" y="366" width="92" height="30" rx="4" className={styles.accent} />
        </g>
      )}
    </svg>
  );
}
