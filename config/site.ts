/**
 * Deployment settings shared by vite.config.ts and the build scripts.
 * Both values come from the environment so the same code works for
 * `username.github.io/repo/`, a root `*.github.io` site and a custom domain.
 */

/** Public base path, always with leading and trailing slash: "/" or "/repo/". */
export function siteBase(value = process.env.SITE_BASE): string {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/** Site origin without a trailing slash, used for canonical and hreflang URLs. */
export function siteOrigin(value = process.env.SITE_ORIGIN): string {
  const origin = (value ?? '').trim().replace(/\/+$/, '');
  return origin ? origin.toLowerCase() : 'http://localhost:4173';
}
