/** Service directions, in display order. Text lives in the locale dictionaries. */
export const serviceIds = [
  'websites',
  'telegram-bots',
  'mini-apps',
  'branding',
  'web-applications',
] as const;

export type ServiceId = (typeof serviceIds)[number];

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && (serviceIds as readonly string[]).includes(value);
}
