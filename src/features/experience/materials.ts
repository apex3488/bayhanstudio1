import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SpriteMaterial,
  type Material,
  type Texture,
} from 'three';

/** Brand blue pushed above 1.0 so it blooms and reads as emitted light after tone mapping. */
const SENSOR_BLUE = new Color('#3478F6').multiplyScalar(3);

function createGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(170, 204, 255, 1)');
    g.addColorStop(0.22, 'rgba(52, 120, 246, 0.55)');
    g.addColorStop(1, 'rgba(52, 120, 246, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

/** Shared materials of the sculpture, disposed together on unmount. */
export function useRobotMaterials() {
  const materials = useMemo(() => {
    const glowTexture = createGlowTexture();
    return {
      glowTexture,
      /** Main shell: black anodised metal */
      shell: new MeshPhysicalMaterial({
        color: '#0d121c',
        metalness: 0.92,
        roughness: 0.36,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
      }),
      /** Face plates: brushed chrome — anisotropy stretches highlights along the grain */
      plate: new MeshPhysicalMaterial({
        color: '#6d7889',
        metalness: 1,
        roughness: 0.34,
        anisotropy: 0.8,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      }),
      /** Polished chrome accents */
      chrome: new MeshPhysicalMaterial({ color: '#dfe5ee', metalness: 1, roughness: 0.08 }),
      /** Secondary panels: dark gunmetal */
      gunmetal: new MeshStandardMaterial({ color: '#232c3c', metalness: 0.95, roughness: 0.3 }),
      /** Cables and gaskets */
      rubber: new MeshStandardMaterial({ color: '#06080c', metalness: 0.1, roughness: 0.62 }),
      /** Visor glass: deep, glossy, almost black */
      glass: new MeshPhysicalMaterial({
        color: '#020306',
        metalness: 0.4,
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
      }),
      /** Recessed slots and seams */
      cavity: new MeshStandardMaterial({ color: '#020306', metalness: 0.2, roughness: 0.9 }),
      sensor: new MeshBasicMaterial({ color: SENSOR_BLUE, toneMapped: false }),
      pupil: new MeshBasicMaterial({
        color: new Color('#e2ecff').multiplyScalar(2.6),
        toneMapped: false,
      }),
      led: new MeshBasicMaterial({
        color: new Color('#3478F6').multiplyScalar(1.6),
        toneMapped: false,
      }),
      dimSensor: new MeshBasicMaterial({ color: new Color('#3478F6').multiplyScalar(0.7) }),
      glow: new SpriteMaterial({
        map: glowTexture,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.85,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      for (const value of Object.values(materials)) (value as Material | Texture).dispose();
    },
    [materials],
  );

  return materials;
}

export type RobotMaterials = ReturnType<typeof useRobotMaterials>;
