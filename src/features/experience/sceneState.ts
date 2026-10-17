/**
 * Shared, mutable state between the DOM (ScrollTrigger) and the render loop.
 * Written by Experience.tsx on scroll, read every frame by the scene — no React re-renders.
 */
export interface CameraOverride {
  position: [number, number, number];
  target: [number, number, number];
}

export const sceneState = {
  /** 0 → 1 while the hero scrolls into the manifesto: the camera dives toward the visor */
  dive: 0,
  /** 0 → 1 as the contact finale enters: the head turns to face the visitor */
  finale: 0,
  /** Narrow / portrait layout: the head is centred above the text instead of beside it */
  compact: false,
  /** Development only: fixed camera for capturing poster and media frames */
  override: null as CameraOverride | null,
  /** Development only: fixed head pose (pointer-space) for deterministic stills */
  pose: null as { x: number; y: number } | null,
};

/** Resolved once the 3D scene has drawn its first frames; the preloader waits on it. */
let resolveReady: () => void = () => {};
export const sceneReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function markSceneReady(): void {
  resolveReady();
}

let chunk: Promise<typeof import('./ExperienceCanvas')> | null = null;

/** Single entry point for the heavy 3D chunk, shared by the preloader and the layer. */
export function loadSceneChunk() {
  chunk ??= import('./ExperienceCanvas');
  return chunk;
}
