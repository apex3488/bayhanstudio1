import { extend, useFrame, type ThreeElement } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  MathUtils,
  Shape,
  type ExtrudeGeometryOptions,
  type Group,
  type Mesh,
  type Sprite,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { RobotMaterials } from './materials';
import { pointer } from './pointer';

extend({ RoundedBoxGeometry });

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

const PLATE_EXTRUDE: ExtrudeGeometryOptions = {
  depth: 0.1,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.03,
  bevelSegments: 4,
  curveSegments: 1,
};

function polygon(points: [number, number][]): Shape {
  const shape = new Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

/** Default yaw: the head looks slightly toward the headline on the left. */
const BASE_YAW = -0.32;
const SLIT_HALF = 0.56;

/**
 * "Sentinel" — an abstract sensor head assembled from machined plates.
 * Everything is procedural: no external model, no textures, ~20k triangles.
 */
export function SentinelHead({ materials }: { materials: RobotMaterials }) {
  const head = useRef<Group>(null);
  const pupil = useRef<Mesh>(null);
  const glow = useRef<Sprite>(null);

  const shapes = useMemo(
    () => ({
      brow: [
        polygon([
          [-0.66, 0.9],
          [0.66, 0.9],
          [0.74, 0.27],
          [-0.74, 0.27],
        ]),
        PLATE_EXTRUDE,
      ] as const,
      jaw: [
        polygon([
          [-0.73, 0.02],
          [0.73, 0.02],
          [0.52, -0.6],
          [0.17, -0.9],
          [-0.17, -0.9],
          [-0.52, -0.6],
        ]),
        PLATE_EXTRUDE,
      ] as const,
    }),
    [],
  );

  useFrame((state, delta) => {
    const g = head.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    // Pointer when available, otherwise a slow autonomous scan.
    const idle = pointer.idle(t);
    const tx = idle ? Math.sin(t * 0.35) * 0.55 : pointer.x;
    const ty = idle ? Math.sin(t * 0.21) * 0.25 : pointer.y;

    g.rotation.y = MathUtils.damp(g.rotation.y, BASE_YAW + tx * 0.42, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -ty * 0.2, 3, dt);
    g.position.y = Math.sin(t * 0.8) * 0.025;

    if (pupil.current && glow.current) {
      const px = MathUtils.damp(pupil.current.position.x, tx * SLIT_HALF, 5, dt);
      pupil.current.position.x = px;
      glow.current.position.x = px;
      glow.current.material.opacity = 0.7 + Math.sin(t * 2.3) * 0.08;
    }
  });

  const m = materials;

  return (
    <group position={[0, 0.25, 0]}>
      {/* Neck — static, the head pivots on top of it */}
      <group position={[0, -1.32, -0.12]}>
        <mesh material={m.shell} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.36, 0.42, 0.62, 48]} />
        </mesh>
        {[0.26, 0.04, -0.18].map((y) => (
          <mesh key={y} material={m.gunmetal} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.028, 12, 64]} />
          </mesh>
        ))}
        <mesh material={m.shell} position={[0, -0.44, 0]}>
          <cylinderGeometry args={[0.62, 0.98, 0.34, 64]} />
        </mesh>
        <mesh material={m.plate} position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.6, 0.62, 0.025, 64]} />
        </mesh>
      </group>

      <group ref={head} position={[0, -0.08, 0]} rotation={[0, BASE_YAW, 0]}>
        {/* Cranium */}
        <mesh material={m.shell} position={[0, 0.12, -0.08]}>
          <roundedBoxGeometry args={[1.54, 1.92, 1.68, 8, 0.56]} />
        </mesh>

        {/* Brow plate, tilted forward */}
        <mesh material={m.plate} position={[0, 0, 0.74]} rotation={[-0.07, 0, 0]}>
          <extrudeGeometry args={shapes.brow} />
        </mesh>

        {/* Jaw plate; details share its tilt and sit on its front face (z = depth + bevel) */}
        <group position={[0, 0, 0.72]} rotation={[0.12, 0, 0]}>
          <mesh material={m.plate}>
            <extrudeGeometry args={shapes.jaw} />
          </mesh>
          {/* Cooling slots */}
          {[
            { y: -0.36, w: 0.52 },
            { y: -0.47, w: 0.4 },
            { y: -0.58, w: 0.28 },
          ].map(({ y, w }) => (
            <mesh key={y} material={m.cavity} position={[0, y, 0.136]}>
              <boxGeometry args={[w, 0.035, 0.006]} />
            </mesh>
          ))}
          {/* Centre seam splitting the jaw into two machined halves */}
          <mesh material={m.cavity} position={[0, -0.44, 0.136]}>
            <boxGeometry args={[0.016, 0.88, 0.006]} />
          </mesh>
        </group>

        {/* Visor: glass band, sensor line, moving pupil and its glow */}
        <mesh material={m.glass} position={[0, 0.145, 0.8]}>
          <roundedBoxGeometry args={[1.54, 0.22, 0.34, 4, 0.08]} />
        </mesh>
        <mesh material={m.sensor} position={[0, 0.145, 0.975]}>
          <boxGeometry args={[SLIT_HALF * 2 + 0.16, 0.022, 0.01]} />
        </mesh>
        <mesh ref={pupil} material={m.pupil} position={[0, 0.145, 0.982]}>
          <boxGeometry args={[0.15, 0.05, 0.01]} />
        </mesh>
        <sprite ref={glow} material={m.glow} position={[0, 0.145, 1.0]} scale={[0.9, 0.5, 1]} />

        {/* Corner bolts on the brow */}
        {[-0.56, 0.56].map((x) => (
          <mesh
            key={x}
            material={m.gunmetal}
            position={[x, 0.78, 0.88]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
          </mesh>
        ))}

        {/* Crown ridges */}
        <mesh material={m.plate} position={[0, 1.1, -0.05]}>
          <roundedBoxGeometry args={[0.16, 0.12, 1.5, 3, 0.04]} />
        </mesh>
        {[-0.36, 0.36].map((x) => (
          <mesh key={x} material={m.gunmetal} position={[x, 1.05, -0.12]}>
            <roundedBoxGeometry args={[0.1, 0.08, 1.15, 3, 0.03]} />
          </mesh>
        ))}

        {/* Temples: layered plates and receivers, mirrored */}
        {[-1, 1].map((side) => (
          <group key={side} scale={[side, 1, 1]}>
            {[
              { x: 0.8, h: 1.12, d: 1.24, y: 0.22, z: -0.06, mat: m.gunmetal },
              { x: 0.84, h: 0.82, d: 0.92, y: 0.3, z: -0.2, mat: m.plate },
              { x: 0.88, h: 0.5, d: 0.6, y: 0.38, z: -0.32, mat: m.gunmetal },
            ].map((p) => (
              <mesh key={p.x} material={p.mat} position={[p.x, p.y, p.z]}>
                <roundedBoxGeometry args={[0.06, p.h, p.d, 3, 0.025]} />
              </mesh>
            ))}
            <mesh material={m.shell} position={[0.86, -0.18, -0.1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.14, 48]} />
            </mesh>
            <mesh material={m.plate} position={[0.94, -0.18, -0.1]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.24, 0.018, 12, 64]} />
            </mesh>
            <mesh
              material={m.dimSensor}
              position={[0.94, -0.18, -0.1]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry args={[0.12, 0.008, 8, 48]} />
            </mesh>
          </group>
        ))}

        {/* Spine plates on the back */}
        {[0.72, 0.42, 0.12, -0.18].map((y, i) => (
          <mesh
            key={y}
            material={m.gunmetal}
            position={[0, y, -0.96 + i * 0.015]}
            rotation={[0.2, 0, 0]}
          >
            <roundedBoxGeometry args={[0.5 - i * 0.06, 0.08, 0.28, 3, 0.03]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
