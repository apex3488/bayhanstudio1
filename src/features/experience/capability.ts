/**
 * Decides whether the device gets the live 3D scene or the static poster.
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

function supportsWebGL2(allowSoftware: boolean): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Software rasterisers (GPU blocklisted, VMs, remote desktops) would render the
    // scene on the CPU and starve the page: treat them as "no WebGL".
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return allowSoftware || !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

let cached: boolean | null = null;

/** Evaluated once per page; the preloader and the scene layer share the answer. */
export function canRender3D(): boolean {
  if (cached !== null) return cached;
  cached = evaluate();
  return cached;
}

function evaluate(): boolean {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return false;

  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return false;
  // Only truly slow links: Chrome often reports "3g" for ordinary connections.
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return false;

  // Development stills are rendered in headless Chrome, which only has a software
  // renderer; `?capture=` lets that one path through. Never active in production.
  const capturing =
    import.meta.env.DEV && new URLSearchParams(window.location.search).has('capture');
  return supportsWebGL2(capturing);
}

/** Rendering tier: bloom, particle count and pixel ratio scale with it. */
export function renderTier(): 'high' | 'low' {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 768;
  return coarse || small ? 'low' : 'high';
}
