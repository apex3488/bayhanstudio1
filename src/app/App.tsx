import { StrictMode } from 'react';
import { SiteLayout } from '../components/SiteLayout';
import type { Locale } from '../i18n/locales';
import type { Dictionary } from '../i18n/types';
import { PageProvider } from './PageContext';
import type { RouteDefinition } from './routes';

interface AppProps {
  route: RouteDefinition;
  locale: Locale;
  t: Dictionary;
}

/** Shared by the server render and client hydration — must produce identical markup. */
export function App({ route, locale, t }: AppProps) {
  const Page = route.component;
  return (
    <StrictMode>
      <PageProvider locale={locale} routeId={route.id} t={t}>
        <SiteLayout>
          <Page />
        </SiteLayout>
      </PageProvider>
    </StrictMode>
  );
}
