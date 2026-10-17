import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowIcon } from './ArrowIcon';
import styles from './ButtonLink.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'm' | 'l';
  icon?: boolean;
}

/** Real <button> for in-page actions (forms); shares the visual language of ButtonLink. */
export function Button({
  children,
  variant = 'primary',
  size = 'm',
  icon = true,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');
  return (
    <button {...props} type={type} className={classes}>
      <span className={styles.label}>{children}</span>
      {icon && (
        <span className={styles.icon}>
          <ArrowIcon />
        </span>
      )}
    </button>
  );
}
