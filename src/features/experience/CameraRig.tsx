import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { MathUtils, Vector3, type DirectionalLight, type PointLight } from 'three';
import { pointer } from './pointer';
import { sceneState } from './sceneState';

type V3 = [number, number, number];

interface Shot {
  position: V3;
  target: V3;
}

/** Head position per layout: beside the headline on wide screens, above it on narrow ones. */
export function headAnchor(compact: boolean): V3 {
  return compact ? [0, 0.75, 0] : [1.7, 0.05, 0];
}

function shots(compact: boolean): { hero: Shot; dive: Shot; finale: Shot } {
  const [hx, hy] = headAnchor(compact);
  return compact
    ? {
        hero: { position: [0, -1.5, 14.5], target: [0, -1.43, 0] },
        dive: { position: [0.1, 0.95, 3.1], target: [hx, hy + 0.1, 0.6] },
        finale: { position: [0, -0.4, 7.6], target: [hx, hy - 0.2, 0] },
      }
    : {
        hero: { position: [0.2, 0.2, 9.2], target: [0.35, 0.15, 0] },
        dive: { position: [hx + 0.18, hy + 0.32, 2.5], target: [hx, hy + 0.28, 0.6] },
        finale: { position: [hx - 2.2, -0.7, 6.6], target: [hx - 1.7, hy + 0.15, 0] },
      };
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

function mix(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * One continuous camera move bound to scroll: hero framing → dive to the visor →
 * (scene hidden through the middle of the page) → low finale shot facing the visitor.
 * Pointer adds parallax on top; a sweeping light crosses the metal on its own clock.
 */
export function CameraRig({
  sweep,
  spill,
}: {
  sweep: RefObject<PointLight | null>;
  spill: RefObject<DirectionalLight | null>;
}) {
  const look = useRef(new Vector3());
  const pos = useRef(new Vector3());

  useFrame((state, delta) => {
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);
    const s = shots(sceneState.compact);
    let position: V3;
    let target: V3;

    if (sceneState.override) {
      ({ position, target } = sceneState.override);
    } else {
      const base = {
        position: mix(s.hero.position, s.dive.position, ease(sceneState.dive)),
        target: mix(s.hero.target, s.dive.target, ease(sceneState.dive)),
      };
      position = mix(base.position, s.finale.position, ease(sceneState.finale));
      target = mix(base.target, s.finale.target, ease(sceneState.finale));
      const parallax = 1 - sceneState.dive * 0.7;
      position = [
        position[0] + pointer.x * 0.35 * parallax,
        position[1] + pointer.y * 0.18 * parallax,
        position[2],
      ];
    }

    const lambda = sceneState.override ? 100 : 4;
    pos.current.set(
      MathUtils.damp(camera.position.x, position[0], lambda, dt),
      MathUtils.damp(camera.position.y, position[1], lambda, dt),
      MathUtils.damp(camera.position.z, position[2], lambda, dt),
    );
    camera.position.copy(pos.current);
    look.current.set(
      MathUtils.damp(look.current.x, target[0], lambda, dt),
      MathUtils.damp(look.current.y, target[1], lambda, dt),
      MathUtils.damp(look.current.z, target[2], lambda, dt),
    );
    camera.lookAt(look.current);

    // Blue light passing slowly across the metal, like a scanner in a dark room.
    const t = state.clock.elapsedTime;
    const [hx, hy] = headAnchor(sceneState.compact);
    if (sweep.current) {
      sweep.current.position.set(hx + Math.sin(t * 0.32) * 2.6, hy + 0.6, 1.8);
      sweep.current.intensity = 6 + sceneState.finale * 4;
    }
    if (spill.current)
      spill.current.intensity = 3.2 * (1 - sceneState.dive * 0.5) + sceneState.finale * 2;
  });

  return null;
}
