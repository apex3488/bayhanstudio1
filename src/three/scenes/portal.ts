import * as THREE from "three";
import type { SceneCtx, SceneModule } from "../engine";
import { mirrorFloor } from "../fx";
import { buildColumns, COLORS, dust, ease, floor, lightMaterial, marbleMaterial, techGrid } from "../kit";

/** PORTAL — a stone arch holding a plane of light: the way in. */
export default function portal(ctx: SceneCtx): SceneModule {
  const { scene, camera, mobile } = ctx;
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.035);
  ctx.bloom.strength = 0.75;
  ctx.bloom.radius = 0.9;
  ctx.bloom.threshold = 0.85;

  const octaves = mobile ? 3 : 4;
  const stone = marbleMaterial({ seedAttr: true, octaves });
  const plain = marbleMaterial({ octaves, scale: 0.6, color: 0xbac1cd });

  scene.add(floor(40, -0.3));
  if (!mobile) scene.add(mirrorFloor(30, -0.297, 0.4));
  const grid = techGrid(30, -0.295);
  scene.add(grid.mesh);
  for (let i = 0; i < 2; i++) {
    const w = 7.2 - i * 0.7;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 3.4 - i * 0.6), plain);
    step.position.y = -0.225 + i * 0.15;
    step.receiveShadow = step.castShadow = true;
    scene.add(step);
  }

  const X = 1.95;
  const columns = buildColumns(
    [
      { x: -X, z: 0, phase: 0.4 },
      { x: X, z: 0, phase: 2.2 },
    ],
    { material: stone, seam: lightMaterial(COLORS.blueHi, 2.2), drums: 4, drumH: 0.92, rBase: 0.4, rTop: 0.34 },
  );
  scene.add(columns.group);
  const top = columns.height + 0.05;

  // semicircular arch, extruded in depth
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, X + 0.48, 0, Math.PI, false);
  archShape.absarc(0, 0, X - 0.48, Math.PI, 0, true);
  archShape.closePath();
  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 1,
    curveSegments: 40,
  });
  archGeo.translate(0, 0, -0.45);
  const arch = new THREE.Mesh(archGeo, plain);
  arch.castShadow = arch.receiveShadow = true;
  scene.add(arch);

  // plane of light filling the opening
  const inner = X - 0.5;
  const veilShape = new THREE.Shape();
  veilShape.moveTo(-inner, 0);
  veilShape.lineTo(inner, 0);
  veilShape.lineTo(inner, top);
  veilShape.absarc(0, top, inner, 0, Math.PI, false);
  veilShape.lineTo(-inner, 0);
  const veilMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uPointer: { value: new THREE.Vector2() } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPower;
      uniform vec2 uPointer;
      varying vec2 vP;
      float h(float n) { return fract(sin(n * 91.345) * 47453.5453); }
      void main() {
        float x = vP.x * 9.0;
        float col = floor(x);
        float fx = fract(x);
        // vertical threads of light falling at different speeds — flutes made of data
        float speed = 0.25 + h(col) * 0.9;
        float y = vP.y * (0.6 + h(col + 7.0)) - uTime * speed;
        float dash = smoothstep(0.55, 1.0, fract(y)) * smoothstep(1.0, 0.92, fract(y));
        float thread = smoothstep(0.5, 0.42, abs(fx - 0.5) * 2.0 + 0.4) * dash;
        float edge = smoothstep(0.42, 0.5, abs(fx - 0.5));
        float veil = 0.06 + 0.05 * sin(vP.y * 2.0 + uTime * 0.6);
        float near = exp(-3.0 * distance(vP, vec2(uPointer.x * 1.4, 2.2 + uPointer.y * 1.6)));
        float a = (thread * 1.4 + edge * 0.35 + veil + near * 0.35) * uPower;
        gl_FragColor = vec4(mix(vec3(0.06, 0.38, 1.0), vec3(0.65, 0.86, 1.0), thread + near * 0.5) * a, a);
      }
    `,
  });
  const veil = new THREE.Mesh(new THREE.ShapeGeometry(veilShape, 32), veilMat);
  scene.add(veil);

  const motes = dust(mobile ? 120 : 260, new THREE.Vector3(10, 7, 8), new THREE.Vector3(0, 3, 1));
  scene.add(motes.points);

  scene.add(new THREE.HemisphereLight(0xb9c8e6, 0x05070c, 0.1));
  const key = new THREE.SpotLight(0xe2ebff, 0, 40, 0.5, 0.85, 2);
  key.position.set(-5, 8, 8);
  key.target.position.set(0, 2.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const back = new THREE.PointLight(COLORS.blue, 0, 30, 2);
  back.position.set(0, 2.6, -1.6);
  scene.add(back);
  const fill = new THREE.PointLight(COLORS.ice, 0, 18, 2);
  scene.add(fill);

  const look = new THREE.Vector3();
  const setArch = () => {
    arch.position.y = top;
  };
  setArch();

  return {
    update(time) {
      const intro = ease.outExpo(ease.clamp01(time / 3));
      const portrait = ctx.aspect < 0.9;
      const dist = (portrait ? 14.5 : 11.2) + (1 - intro) * 3;
      const angle = (portrait ? 0 : -0.22) + ctx.pointer.x * 0.07;
      camera.position.set(Math.sin(angle) * dist, 1.9 + ctx.pointer.y * 0.2, Math.cos(angle) * dist);
      const side = portrait ? 0 : -2.6;
      look.set(Math.cos(angle) * side, portrait ? 1.2 : 2.7, -Math.sin(angle) * side);
      camera.lookAt(look);

      columns.layout(0.08 + (1 - intro) * 0.6, time);
      arch.position.y = top + 0.1 + (1 - intro) * 0.8 + Math.sin(time * 0.45) * 0.03;
      veilMat.uniforms.uTime.value = time;
      veilMat.uniforms.uPower.value = intro;
      veilMat.uniforms.uPointer.value.copy(ctx.pointer);
      key.intensity = 330 * intro;
      back.intensity = 45 * intro * (0.9 + 0.1 * Math.sin(time * 1.4));
      fill.intensity = 8 * intro;
      fill.position.set(ctx.pointer.x * 3, 2.4 + ctx.pointer.y * 1.5, 3.2);
      motes.uniforms.uTime.value = time;
      grid.uniforms.uTime.value = time;
      grid.uniforms.uPower.value = intro;
    },
  };
}
