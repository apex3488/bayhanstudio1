/**
 * Decides whether the device should get the live 3D scene or the static poster.
 * The poster is the default: 3D is an enhancement, never a requirement.
 */

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

type NavigatorWithHints = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
};

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function canRender3D(): boolean {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return false;

  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return false;
  // Only truly slow links: Chrome often reports "3g" for ordinary connections, and the
  // 3D chunk loads after idle without blocking anything.
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return false;

  return supportsWebGL2();
}
