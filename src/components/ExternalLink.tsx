import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { usePage } from '../app/PageContext';

interface ExternalLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'target' | 'rel'
> {
  href: string;
  children: ReactNode;
}

/** Link to a third-party site; announces to screen readers that it opens a new tab. */
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  const { t } = usePage();
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> ({t.a11y.opensInNewTab})</span>
    </a>
  );
}
