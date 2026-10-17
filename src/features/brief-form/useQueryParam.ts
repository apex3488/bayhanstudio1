import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * Reads a query parameter after hydration without a state-in-effect round trip.
 * The server snapshot is null, so prerendered HTML and first client render match.
 */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}
