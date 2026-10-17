import type { ReactNode } from 'react';
import { usePage } from '../app/PageContext';
import { Preloader } from './Preloader';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = usePage();
  return (
    <>
      <Preloader />
      <a className="skip-link" href="#main">
        {t.a11y.skipToContent}
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
