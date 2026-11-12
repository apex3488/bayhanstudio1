import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const COLORS = {
  ink: 0x050609,
  blue: 0x146cff,
  blueHi: 0x38a4ff,
  ice: 0xa6d9ff,
  marble: 0xd7dce6,
};

/* ------------------------------------------------------------------ */
/* Marble: MeshStandardMaterial with procedural veining in the shader. */
/* Optional "digitisation" plane turns one side into hologram lines.   */
/* ------------------------------------------------------------------ */

const NOISE = /* glsl */ `
  float mhash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float mnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(mhash(i), mhash(i + vec3(1, 0, 0)), f.x), mix(mhash(i + vec3(0, 1, 0)), mhash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(mhash(i + vec3(0, 0, 1)), mhash(i + vec3(1, 0, 1)), f.x), mix(mhash(i + vec3(0, 1, 1)), mhash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }
  float mfbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < MARBLE_OCTAVES; i++) {
      s += a * mnoise(p);
      p = p * 2.02 + vec3(1.7, 9.2, 4.1);
      a *= 0.5;
    }
    return s;
  }
`;

export type MarbleUniforms = {
  uTime: { value: number };
  uMScale: { value: number };
  uHolo: { value: number };
  uHoloOrigin: { value: THREE.Vector3 };
  uHoloDir: { value: THREE.Vector3 };
  uGlow: { value: number };
};

export type MarbleMaterial = THREE.MeshPhysicalMaterial & { userData: { u: MarbleUniforms } };

export function marbleMaterial(
  o: {
    color?: number;
    roughness?: number;
    scale?: number;
    seedAttr?: boolean;
    holo?: boolean;
    octaves?: number;
    normalMap?: THREE.Texture;
    /** 0..1 — strength of the polished clearcoat layer. */
    polish?: number;
  } = {},
): MarbleMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0xe6e8ec,
    roughness: o.roughness ?? 0.52,
    metalness: 0,
    clearcoat: o.polish ?? 0.35,
    clearcoatRoughness: 0.28,
    normalMap: o.normalMap ?? null,
    side: o.holo ? THREE.DoubleSide : THREE.FrontSide,
  }) as MarbleMaterial;

  const u: MarbleUniforms = {
    uTime: { value: 0 },
    uMScale: { value: o.scale ?? 1 },
    uHolo: { value: 100 },
    uHoloOrigin: { value: new THREE.Vector3() },
    uHoloDir: { value: new THREE.Vector3(0.5, 0.8, 0.25).normalize() },
    uGlow: { value: 0 },
  };
  mat.userData.u = u;
  const seed = !!o.seedAttr;
  const holo = !!o.holo;
  const octaves = o.octaves ?? 4;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vMPos;
        varying vec3 vWPos;
        uniform float uMScale;
        ${seed ? "attribute vec3 aSeed;" : ""}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vMPos = position * uMScale${seed ? " + aSeed" : ""};
        vec4 mwp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mwp = instanceMatrix * mwp;
        #endif
        vWPos = (modelMatrix * mwp).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        #define MARBLE_OCTAVES ${octaves}
        varying vec3 vMPos;
        varying vec3 vWPos;
        uniform float uTime;
        uniform float uHolo;
        uniform vec3 uHoloOrigin;
        uniform vec3 uHoloDir;
        uniform float uGlow;
        ${NOISE}`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        ${
          holo
            ? `float hS = dot(vWPos - uHoloOrigin, uHoloDir) + (mnoise(vWPos * 2.6 + uTime * 0.15) - 0.5) * 0.22 - uHolo;
               float hLine = fract(vWPos.y * 30.0 - uTime * 0.4);
               if (hS > 0.0 && hLine > 0.3) discard;`
            : ""
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float mN = mfbm(vMPos * 1.1 + mfbm(vMPos * 0.5) * 1.6);
        float mVein = 1.0 - smoothstep(0.0, 0.04, abs(mN - 0.5));
        float mCloud = mfbm(vMPos * 4.2 + 3.0);
        diffuseColor.rgb *= mix(vec3(1.0), vec3(0.5, 0.53, 0.6), mVein * 0.5) * (0.88 + 0.18 * mCloud);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor - 0.14 * mVein + 0.12 * (mCloud - 0.5), 0.06, 1.0);`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        gl_FragColor.rgb += vec3(0.08, 0.36, 1.0) * uGlow * (0.25 + mVein * 2.2);
        ${
          holo
            ? `if (hS > 0.0) {
                 float hF = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.4);
                 vec3 hC = mix(vec3(0.05, 0.36, 1.0), vec3(0.62, 0.86, 1.0), hF);
                 gl_FragColor = vec4(hC * (0.22 + 1.5 * hF), 1.0);
               }
               gl_FragColor.rgb += vec3(0.42, 0.78, 1.0) * smoothstep(0.05, 0.0, abs(hS)) * 1.5;`
            : ""
        }`,
      );
  };
  mat.customProgramCacheKey = () => `marble-${seed}-${holo}-${octaves}`;
  mat.envMapIntensity = 1.4;
  return mat;
}

/** Emissive "line of light" material — the only thing allowed to bloom. */
export function lightMaterial(color = COLORS.blueHi, intensity = 2.4) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** Unit fluted drum (radius 1, height 1) with sharp arrises and a chamfer. */
export function drumGeometry(flutes = 20, perFlute = 8, depth = 0.075): THREE.BufferGeometry {
  const segs = flutes * perFlute;
  const rows = [
    { y: -0.5, k: 0.975 },
    { y: -0.47, k: 1 },
    { y: 0.47, k: 1 },
    { y: 0.5, k: 0.975 },
  ];
  const pos: number[] = [];
  const idx: number[] = [];
  const radius = (i: number) => 1 - depth * Math.sin(Math.PI * ((i % perFlute) / perFlute));

  for (const row of rows) {
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const r = radius(i) * row.k;
      pos.push(r * Math.cos(t), row.y, r * Math.sin(t));
    }
  }
  for (let r = 0; r < rows.length - 1; r++) {
    for (let i = 0; i < segs; i++) {
      const a = r * segs + i;
      const b = r * segs + ((i + 1) % segs);
      const c = (r + 1) * segs + i;
      const d = (r + 1) * segs + ((i + 1) % segs);
      idx.push(a, c, b, b, c, d);
    }
  }
  // caps with their own vertices so the edge stays crisp
  for (const top of [false, true]) {
    const row = top ? rows[rows.length - 1] : rows[0];
    const center = pos.length / 3;
    pos.push(0, row.y, 0);
    const start = pos.length / 3;
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const r = radius(i) * row.k;
      pos.push(r * Math.cos(t), row.y, r * Math.sin(t));
    }
    for (let i = 0; i < segs; i++) {
      const a = start + i;
      const b = start + ((i + 1) % segs);
      if (top) idx.push(center, b, a);
      else idx.push(center, a, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Doric capital for a shaft of top radius 1: echinus + abacus. Height ≈ 0.86. */
export function capitalGeometry(): THREE.BufferGeometry {
  const pts = [
    [0.96, 0],
    [1.0, 0.04],
    [1.0, 0.1],
    [1.05, 0.14],
    [1.2, 0.3],
    [1.38, 0.44],
    [1.46, 0.52],
    [1.46, 0.56],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const echinus = new THREE.LatheGeometry(pts, 48);
  const abacus = new THREE.BoxGeometry(3.05, 0.3, 3.05);
  abacus.translate(0, 0.71, 0);
  const merged = mergeGeometries([echinus, abacus]);
  echinus.dispose();
  abacus.dispose();
  merged.computeVertexNormals();
  return merged;
}

/** Flat arc block lying in the XZ plane (a piece of a circular entablature). */
export function arcBlockGeometry(rIn: number, rOut: number, height: number, start: number, length: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, start, start + length, false);
  shape.absarc(0, 0, rIn, start + length, start, true);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/* ------------------------------------------------------------------ */
/* Columns: instanced drums, seams of light, capitals                  */
/* ------------------------------------------------------------------ */

export type ColumnSpec = { x: number; z: number; y?: number; drums?: number; capital?: boolean; phase?: number };

export type ColumnSet = {
  group: THREE.Group;
  height: number;
  layout(spread: number, time: number): void;
};

export function buildColumns(
  specs: ColumnSpec[],
  o: {
    drums?: number;
    drumH?: number;
    rBase?: number;
    rTop?: number;
    gap?: number;
    material: MarbleMaterial;
    seam?: THREE.Material;
    capitalMaterial?: THREE.Material;
    shadows?: boolean;
  },
): ColumnSet {
  const maxDrums = o.drums ?? 5;
  const H = o.drumH ?? 0.9;
  const rBase = o.rBase ?? 0.36;
  const rTop = o.rTop ?? 0.3;
  const baseGap = o.gap ?? 0.035;
  const group = new THREE.Group();

  const cols = specs.map((s, i) => ({
    ...s,
    y: s.y ?? 0,
    drums: s.drums ?? maxDrums,
    capital: s.capital ?? true,
    phase: s.phase ?? i * 1.73,
  }));
  const drumCount = cols.reduce((n, c) => n + c.drums, 0);

  const geo = drumGeometry();
  const seeds = new Float32Array(drumCount * 3);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random() * 40;
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 3));
  const drums = new THREE.InstancedMesh(geo, o.material, drumCount);
  drums.castShadow = drums.receiveShadow = o.shadows ?? true;
  drums.frustumCulled = false;
  group.add(drums);

  let seams: THREE.InstancedMesh | null = null;
  if (o.seam) {
    seams = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 40, 1, false), o.seam, drumCount);
    seams.frustumCulled = false;
    group.add(seams);
  }

  const capCount = cols.filter((c) => c.capital).length;
  let capitals: THREE.InstancedMesh | null = null;
  if (capCount) {
    const capGeo = capitalGeometry();
    const capSeeds = new Float32Array(capCount * 3);
    for (let i = 0; i < capSeeds.length; i++) capSeeds[i] = Math.random() * 40;
    capGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(capSeeds, 3));
    capitals = new THREE.InstancedMesh(capGeo, o.capitalMaterial ?? o.material, capCount);
    capitals.castShadow = capitals.receiveShadow = o.shadows ?? true;
    capitals.frustumCulled = false;
    group.add(capitals);
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const layout = (spread: number, time: number) => {
    let di = 0;
    let ci = 0;
    for (const c of cols) {
      let y = c.y;
      for (let d = 0; d < c.drums; d++) {
        const t = maxDrums > 1 ? d / (maxDrums - 1) : 0;
        const r = THREE.MathUtils.lerp(rBase, rTop, t);
        const gap = d === 0 ? 0 : baseGap + spread * (0.06 + d * 0.035);
        const bob = Math.sin(time * 0.55 + c.phase + d * 0.9) * (0.012 + spread * 0.05) * (d > 0 ? 1 : 0);
        if (seams) {
          // a thin blade of light floating in the gap below this drum
          s.set(r * 0.78, 0.012, r * 0.78);
          p.set(c.x, y + (gap + bob) / 2, c.z);
          q.identity();
          m.compose(p, q, d === 0 ? s.set(0.0001, 0.0001, 0.0001) : s);
          seams.setMatrixAt(di, m);
        }
        y += gap + bob;
        q.setFromAxisAngle(up, spread * d * 0.22 * (ci % 2 ? 1 : -1) + c.phase);
        p.set(c.x, y + H / 2, c.z);
        s.set(r, H, r);
        m.compose(p, q, s);
        drums.setMatrixAt(di, m);
        y += H;
        di++;
      }
      if (c.capital && capitals) {
        const lift = baseGap + spread * 0.5 + Math.sin(time * 0.5 + c.phase) * (0.012 + spread * 0.05);
        q.setFromAxisAngle(up, Math.atan2(c.x, c.z));
        p.set(c.x, y + lift, c.z);
        s.setScalar(rTop);
        m.compose(p, q, s);
        capitals.setMatrixAt(ci, m);
        ci++;
      }
    }
    drums.instanceMatrix.needsUpdate = true;
    if (seams) seams.instanceMatrix.needsUpdate = true;
    if (capitals) capitals.instanceMatrix.needsUpdate = true;
  };

  layout(0, 0);
  return { group, height: maxDrums * H + (maxDrums - 1) * baseGap + rTop * 0.86, layout };
}

/* ------------------------------------------------------------------ */
/* Atmosphere                                                          */
/* ------------------------------------------------------------------ */

/** Small studio environment so marble and metal have something to reflect. */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020308);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mats: THREE.Material[] = [];
  const add = (color: number, k: number, pos: [number, number, number], scale: [number, number, number]) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });
    mats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    s.add(mesh);
  };
  add(0xdfe8ff, 5, [0, 9, 0], [9, 0.2, 9]);
  add(0x146cff, 2.5, [-9, 2, -4], [0.2, 7, 7]);
  add(0x38a4ff, 1.2, [9, 1, 3], [0.2, 3, 8]);
  add(0xffffff, 1.5, [0, 3, 10], [8, 3, 0.2]);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.05);
  pm.dispose();
  geo.dispose();
  mats.forEach((m) => m.dispose());
  return rt;
}

/** Slow drifting dust motes that catch the blue light. */
export function dust(count: number, box: THREE.Vector3, center = new THREE.Vector3()) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center.x + (Math.random() - 0.5) * box.x;
    pos[i * 3 + 1] = center.y + (Math.random() - 0.5) * box.y;
    pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * box.z;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 26 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uSize;
      varying float vA;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.25 + aSeed * 40.0) * 0.35;
        p.x += cos(uTime * 0.18 + aSeed * 23.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.4 + aSeed) / -mv.z;
        vA = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 0.8 + aSeed * 60.0));
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * 0.5;
        gl_FragColor = vec4(vec3(0.55, 0.8, 1.0) * a, a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms: mat.uniforms };
}

/** Polished dark stone floor. */
export function floor(radius = 40, y = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshStandardMaterial({ color: 0x080b13, roughness: 0.3, metalness: 0.35 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

export const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  clamp01: (t: number) => Math.min(1, Math.max(0, t)),
};

/* ------------------------------------------------------------------ */
/* Tech layer: polar grid with travelling pulses, light cone           */
/* ------------------------------------------------------------------ */

/** A measuring grid inlaid in the floor: rings, spokes and a pulse radiating from the centre. */
export function techGrid(radius = 30, y = 0.003) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPower: { value: 1 }, uRadius: { value: radius } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPower;
      uniform float uRadius;
      varying vec2 vP;
      float line(float v, float w) { float d = abs(fract(v - 0.5) - 0.5) / fwidth(v); return 1.0 - smoothstep(0.0, w, d); }
      void main() {
        float r = length(vP);
        float a = atan(vP.y, vP.x);
        float rings = line(r, 1.2);
        float spokes = line(a * 12.0 / 3.14159265, 1.2) * smoothstep(1.2, 3.0, r);
        float minor = line(r * 4.0, 1.0) * 0.18;
        float grid = max(rings, spokes) * 0.55 + minor;
        // two pulses travelling outwards
        float p1 = smoothstep(0.9, 0.0, abs(r - mod(uTime * 1.6, uRadius * 0.6)));
        float p2 = smoothstep(0.5, 0.0, abs(r - mod(uTime * 1.6 + uRadius * 0.3, uRadius * 0.6)));
        float pulse = (p1 + p2 * 0.6);
        float fade = smoothstep(uRadius * 0.55, 1.5, r);
        float v = (grid * (0.16 + pulse * 0.9) + pulse * 0.035) * fade * uPower;
        gl_FragColor = vec4(mix(vec3(0.05, 0.36, 1.0), vec3(0.6, 0.84, 1.0), pulse) * v, v);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = 1;
  return { mesh, uniforms: mat.uniforms };
}

/** Soft additive cone of light falling on the subject. */
export function lightCone(height = 7, radius = 2.2) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uPower: { value: 1 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uPower;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float rim = pow(abs(dot(vN, vV)), 2.2);
        float fall = smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
        float streak = 0.75 + 0.25 * sin(vUv.x * 80.0 + uTime * 0.4);
        float a = rim * fall * streak * 0.085 * uPower;
        gl_FragColor = vec4(vec3(0.5, 0.74, 1.0) * a, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 48, 1, true), mat);
  mesh.position.y = height / 2;
  mesh.renderOrder = 2;
  return { mesh, uniforms: mat.uniforms };
}
