import { useRef, type ReactNode } from 'react';
import { sound } from '../features/sound/engine';
import { useMagnetic } from '../motion/useMagnetic';
import { ArrowIcon } from './ArrowIcon';
import styles from './ButtonLink.module.css';
import { ExternalLink } from './ExternalLink';

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'm' | 'l';
  /** Third-party destination: opens in a new tab and is announced as such. */
  external?: boolean;
  /** Pulls toward a precise pointer; ignored for touch and reduced motion. */
  magnetic?: boolean;
  className?: string;
  onClick?: () => void;
}

/** A link styled as a button — CTAs navigate, so they stay real <a> elements. */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'm',
  external = false,
  magnetic = false,
  className,
  onClick,
}: ButtonLinkProps) {
  const wrapper = useRef<HTMLSpanElement>(null);
  useMagnetic(wrapper, magnetic);

  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      <span className={styles.label}>{children}</span>
      <span className={styles.icon}>
        <ArrowIcon direction={external ? 'external' : 'right'} />
      </span>
    </>
  );

  const handleClick = () => {
    sound.play('tick');
    onClick?.();
  };
  const handleEnter = () => sound.play('hover');

  const link = external ? (
    <ExternalLink
      className={classes}
      href={href}
      onClick={handleClick}
      onPointerEnter={handleEnter}
    >
      {content}
    </ExternalLink>
  ) : (
    <a className={classes} href={href} onClick={handleClick} onPointerEnter={handleEnter}>
      {content}
    </a>
  );

  // The magnetic offset moves a wrapper, so the link's own hit area and focus ring stay intact.
  return magnetic ? (
    <span ref={wrapper} className={styles.magnet}>
      {link}
    </span>
  ) : (
    link
  );
}
