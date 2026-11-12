import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

/**
 * Polished stone: a dim mirror laid additively over the lit floor, so the
 * floor keeps its shadows and gains reflections of the architecture.
 */
export function mirrorFloor(radius: number, y: number, strength = 0.32) {
  const mirror = new Reflector(new THREE.CircleGeometry(radius, 64), {
    textureWidth: 1024,
    textureHeight: 1024,
    clipBias: 0.003,
    color: new THREE.Color(strength, strength * 1.05, strength * 1.2),
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = y;
  const mat = mirror.material as THREE.ShaderMaterial;
  mat.transparent = true;
  mat.blending = THREE.AdditiveBlending;
  mat.depthWrite = false;
  mirror.renderOrder = 0;
  return mirror;
}

/** Shafts of light falling from the key light through the dust. */
export function lightShafts(from: THREE.Vector3, to: THREE.Vector3, count = 6, spread = 2.4) {
  const group = new THREE.Group();
  const length = from.distanceTo(to) * 1.15;
  const uniforms = { uTime: { value: 0 }, uPower: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        vUv = uv;
        vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPower;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        float across = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
        float along = smoothstep(1.0, 0.75, vUv.y) * smoothstep(0.0, 0.35, vUv.y);
        float breathe = 0.6 + 0.4 * sin(uTime * 0.35 + vSeed * 20.0);
        float a = across * across * along * breathe * 0.07 * uPower;
        gl_FragColor = vec4(vec3(0.62, 0.78, 1.0) * a, a);
      }
    `,
  });

  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const w = 0.5 + Math.random() * 1.3;
    const g = new THREE.PlaneGeometry(w, length);
    g.translate(0, -length / 2, 0);
    const seed = new Float32Array(4).fill(Math.random());
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread);
    mesh.rotation.y = Math.random() * Math.PI;
    group.add(mesh);
    geos.push(g);
  }
  group.position.copy(from);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  return { group, uniforms };
}

/** Motes of data rising in a slow helix around the subject. */
export function risingSparks(count: number, radius = 1.5, height = 3.6) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.35 + 0.65 * Math.sqrt(Math.random()));
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * height;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seed[i * 3] = Math.random();
    seed[i * 3 + 1] = 0.25 + Math.random() * 0.75;
    seed[i * 3 + 2] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
  const uniforms = { uTime: { value: 0 }, uPower: { value: 1 }, uHeight: { value: height } };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uHeight;
      varying float vA;
      void main() {
        float y = mod(position.y + uTime * aSeed.y * 0.55, uHeight);
        float ang = uTime * 0.25 * (aSeed.x - 0.3) + y * 0.6;
        float c = cos(ang);
        float s = sin(ang);
        vec3 p = vec3(position.x * c - position.z * s, y, position.x * s + position.z * c);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (10.0 + aSeed.z * 22.0) / -mv.z;
        float t = y / uHeight;
        vA = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.6, t) * (0.4 + 0.6 * sin(uTime * 2.0 + aSeed.x * 40.0) * 0.5 + 0.3);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uPower;
      varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        // small square pixels of light rather than soft dots
        float d = max(abs(q.x), abs(q.y));
        float a = smoothstep(0.5, 0.28, d) * vA * uPower;
        gl_FragColor = vec4(vec3(0.5, 0.8, 1.0) * a * 1.6, a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}
