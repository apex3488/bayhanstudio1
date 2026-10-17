import type { ComponentType } from 'react';
import { serviceIds } from '../content/services';
import type { Dictionary, PageMeta } from '../i18n/types';
import ContactPage from '../pages/ContactPage';
import HomePage from '../pages/HomePage';
import PrivacyPage from '../pages/PrivacyPage';
import { servicePageFor } from '../pages/ServiceDetailPage';
import ServicesPage from '../pages/ServicesPage';
import { serviceRouteId, type RouteId } from './routeIds';

export interface RouteDefinition {
  id: RouteId;
  /**
   * Imported statically on purpose: page CSS must be in the stylesheet linked
   * from the prerendered HTML. Heavy features (3D) are lazy-loaded inside pages.
   */
  component: ComponentType;
  meta: (t: Dictionary) => PageMeta;
}

/** Single registry of localized pages. Each entry is prerendered once per locale. */
export const routes: readonly RouteDefinition[] = [
  { id: 'home', component: HomePage, meta: (t) => t.meta.home },
  { id: 'services', component: ServicesPage, meta: (t) => t.meta.services },
  ...serviceIds.map((id): RouteDefinition => ({
    id: serviceRouteId(id),
    component: servicePageFor(id),
    meta: (t) => t.meta.service[id],
  })),
  { id: 'contact', component: ContactPage, meta: (t) => t.meta.contact },
  { id: 'privacy', component: PrivacyPage, meta: (t) => t.meta.privacy },
];

export function findRoute(id: string | undefined): RouteDefinition | undefined {
  return routes.find((route) => route.id === id);
}
