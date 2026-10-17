import type { ServiceId } from './services';

/**
 * Stills rendered from the studio's own 3D scene (no stock, no third-party footage).
 * Captured with the dev helper described in the README; stored in public/media/.
 */
export const MACRO = {
  visor: 'media/macro-visor.webp',
  crown: 'media/macro-crown.webp',
  receiver: 'media/macro-receiver.webp',
  temple: 'media/macro-temple.webp',
  jaw: 'media/macro-jaw.webp',
  profile: 'media/macro-profile.webp',
} as const;

export const MACRO_SIZE = { width: 1600, height: 1000 } as const;

export const serviceMedia: Record<ServiceId, string> = {
  websites: MACRO.visor,
  'online-stores': MACRO.crown,
  'telegram-bots': MACRO.receiver,
  'mini-apps': MACRO.temple,
  'mobile-apps': MACRO.jaw,
  branding: MACRO.profile,
};
