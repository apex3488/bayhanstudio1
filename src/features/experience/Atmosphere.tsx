import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MeshBasicMaterial,
  ShaderMaterial,
  TorusGeometry,
  type Group,
} from 'three';
import { sceneState } from './sceneState';

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // Slow, non-repeating drift: dust in a still room, not a swarm
    p.y += sin(uTime * 0.12 + aSeed * 6.2831) * 0.35;
    p.x += cos(uTime * 0.08 + aSeed * 12.0) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.35 + aSeed) / -mv.z;
    vAlpha = smoothstep(16.0, 3.0, -mv.z) * (0.25 + aSeed * 0.75);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColor, uAccent, step(0.82, vAlpha));
    gl_FragColor = vec4(col, a * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Atmospheric dust lit by the scene: depth cue and a sense of air around the sculpture. */
export function Particles({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.7) * 12;
      seeds[i] = Math.random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    const mat = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 40 },
        uColor: { value: new Color('#9fb3d6') },
        uAccent: { value: new Color('#3478F6').multiplyScalar(2) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const uniforms = material.uniforms as { uTime: { value: number }; uSize: { value: number } };
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uSize.value = 46 * dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Two thin arcs behind the head — instrument rings, not decoration.
 * They rotate only with scroll, never on their own.
 */
export function Halo() {
  const group = useRef<Group>(null);

  const parts = useMemo(() => {
    const inner = new TorusGeometry(1.95, 0.004, 6, 160, Math.PI * 1.25);
    const outer = new TorusGeometry(2.35, 0.003, 6, 200, Math.PI * 0.8);
    const material = new MeshBasicMaterial({
      color: new Color('#3478F6').multiplyScalar(1.4),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      toneMapped: false,
    });
    return { inner, outer, material };
  }, []);

  useEffect(
    () => () => {
      parts.inner.dispose();
      parts.outer.dispose();
      parts.material.dispose();
    },
    [parts],
  );

  useFrame(() => {
    if (!group.current) return;
    const turn = sceneState.dive * 0.9 + sceneState.finale * -0.6;
    group.current.rotation.z = 0.35 + turn;
    parts.material.opacity = 0.45 * (1 - sceneState.dive * 0.7) + sceneState.finale * 0.3;
  });

  return (
    <group ref={group} position={[0, 0.2, -0.9]}>
      <mesh geometry={parts.inner} material={parts.material} />
      <mesh geometry={parts.outer} material={parts.material} rotation={[0, 0, 2.2]} />
    </group>
  );
}
