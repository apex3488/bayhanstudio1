import type { CameraOverride } from './sceneState';

/**
 * Development only: camera set-ups for the stills used across the site
 * (posters and macro frames). Rendered from the live scene with
 * `npm run dev` + `/ru/?capture=<set>`; see README "Self-rendered media".
 * Coordinates assume the wide layout (head anchored at x = 1.7).
 */
export interface Shot extends CameraOverride {
  name: string;
  width: number;
}

const HX = 1.7;

export const CAPTURE_SETS: Record<string, Shot[]> = {
  // Wide hero still: same framing as the live hero, head turned toward the headline.
  'poster-wide': [
    { name: 'poster-wide', width: 1920, position: [0.45, 0.25, 9.2], target: [0.35, 0.15, 0] },
  ],
  // Tall hero still for portrait screens (compact layout: head above the text).
  'poster-tall': [
    { name: 'poster-tall', width: 900, position: [0, -1.5, 14.5], target: [0, -1.43, 0] },
  ],
  macros: [
    { name: 'macro-visor', width: 1600, position: [HX + 0.6, 0.5, 2.0], target: [HX, 0.36, 0.8] },
    { name: 'macro-crown', width: 1600, position: [HX - 1.0, 2.0, 1.7], target: [HX, 1.15, -0.1] },
    {
      name: 'macro-receiver',
      width: 1600,
      position: [HX + 2.1, 0.15, 0.7],
      target: [HX + 0.85, 0.0, -0.1],
    },
    {
      name: 'macro-temple',
      width: 1600,
      position: [HX - 2.1, 0.7, 1.0],
      target: [HX - 0.85, 0.55, -0.05],
    },
    { name: 'macro-jaw', width: 1600, position: [HX + 0.35, -0.7, 2.1], target: [HX, -0.25, 0.8] },
    { name: 'macro-profile', width: 1600, position: [HX + 3.6, 0.45, -0.4], target: [HX, 0.25, 0] },
  ],
};
