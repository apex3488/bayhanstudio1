import type { ServiceId } from '../content/services';

/**
 * Route identifiers live apart from the route registry: pages import these,
 * while the registry imports the pages — keeping the module graph acyclic.
 */
export type ServiceRouteId = `service:${ServiceId}`;
export type RouteId = 'home' | 'services' | 'contact' | 'privacy' | ServiceRouteId;

export function serviceRouteId(id: ServiceId): ServiceRouteId {
  return `service:${id}`;
}

/** Path after the locale segment, without slashes ("" for the locale home). */
export function routeSegment(id: RouteId): string {
  if (id === 'home') return '';
  if (id.startsWith('service:')) return `services/${id.slice('service:'.length)}`;
  return id;
}
