import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '../i18n/locales';
import type { Dictionary } from '../i18n/types';
import type { RouteId } from './routeIds';

interface PageContextValue {
  locale: Locale;
  routeId: RouteId;
  t: Dictionary;
}

const PageContext = createContext<PageContextValue | null>(null);

/** The dictionary is passed in, so the client bundle carries only the page's own locale. */
export function PageProvider({
  locale,
  routeId,
  t,
  children,
}: PageContextValue & { children: ReactNode }) {
  return <PageContext value={{ locale, routeId, t }}>{children}</PageContext>;
}

export function usePage(): PageContextValue {
  const value = useContext(PageContext);
  if (!value) throw new Error('usePage() must be used inside <PageProvider>');
  return value;
}
