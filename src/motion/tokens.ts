/** Motion tokens — mirrors of the CSS custom properties in styles/tokens.css. */
export const duration = {
  micro: 0.16,
  ui: 0.32,
  reveal: 0.72,
  hero: 1.2,
} as const;

export const ease = {
  out: 'expo.out',
  inOut: 'power3.inOut',
  soft: 'power2.out',
} as const;

export const stagger = {
  words: 0.06,
  blocks: 0.09,
} as const;

/** Conditions for gsap.matchMedia(): every animation is opt-in to full motion. */
export const media = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
  desktopPin: '(min-width: 1024px) and (min-height: 640px)',
} as const;
