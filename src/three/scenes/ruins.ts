import * as THREE from "three";
import type { SceneCtx, SceneModule } from "../engine";
import { mirrorFloor } from "../fx";
import { buildColumns, capitalGeometry, COLORS, drumGeometry, dust, ease, floor, lightMaterial, marbleMaterial, techGrid } from "../kit";

/** RUINS — a hall that was never built: one stump standing, drums on the floor. */
export default function ruins(ctx: SceneCtx): SceneModule {
  const { scene, camera, mobile } = ctx;
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.045);
  ctx.bloom.strength = 0.6;
  ctx.bloom.radius = 0.8;
  ctx.bloom.threshold = 0.88;

  const octaves = mobile ? 3 : 4;
  const stone = marbleMaterial({ seedAttr: true, octaves });
  scene.add(floor(40, 0));
  if (!mobile) scene.add(mirrorFloor(30, 0.002, 0.36));
  const grid = techGrid(30, 0.004);
  scene.add(grid.mesh);

  const stump = buildColumns([{ x: -2.3, z: -1.2, drums: 2, capital: false }], {
    material: stone,
    seam: lightMaterial(COLORS.blueHi, 2.4),
    rBase: 0.5,
    rTop: 0.44,
    drumH: 0.9,
  });
  scene.add(stump.group);

  const geo = drumGeometry();
  const fallen: { mesh: THREE.Mesh; ring: THREE.Mesh; phase: number }[] = [];
  const place = (x: number, z: number, r: number, yaw: number, lean = 0, lift = 0) => {
    const mat = marbleMaterial({ octaves, scale: 0.8 + fallen.length * 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(r, 0.9, r);
    mesh.rotation.set(0, yaw, Math.PI / 2 + lean);
    mesh.position.set(x, r * 0.985 + lift, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.007, 6, 80), lightMaterial(COLORS.blueHi, 2));
    // sits on the end face of the drum; undo the parent's non-uniform scale
    ring.rotation.set(Math.PI / 2, 0, 0);
    ring.position.y = 0.52;
    ring.scale.set(1 / r, 1 / r, 1 / 0.9);
    mesh.add(ring);
    fallen.push({ mesh, ring, phase: fallen.length * 1.9 });
  };
  place(-0.4, 0.5, 0.44, 0.5);
  place(1.25, -0.2, 0.42, -0.35);
  place(2.6, 1.0, 0.4, 1.2);
  place(0.55, -1.7, 0.4, 0.1, 0.38, 0.14);

  const cap = new THREE.Mesh(capitalGeometry(), marbleMaterial({ octaves, scale: 1.3 }));
  cap.scale.setScalar(0.4);
  cap.rotation.set(2.5, 0.4, 0.2);
  cap.position.set(-1.1, 0.36, 1.7);
  cap.castShadow = cap.receiveShadow = true;
  scene.add(cap);

  const motes = dust(mobile ? 120 : 260, new THREE.Vector3(10, 5, 9), new THREE.Vector3(0, 2, 0));
  scene.add(motes.points);

  scene.add(new THREE.HemisphereLight(0xb9c8e6, 0x05070c, 0.1));
  const key = new THREE.SpotLight(0xe2ebff, 0, 40, 0.55, 0.9, 2);
  key.position.set(-6, 8, 5);
  key.target.position.set(0, 0.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const rim = new THREE.PointLight(COLORS.blue, 0, 30, 2);
  rim.position.set(4, 2.2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(COLORS.ice, 0, 16, 2);
  scene.add(fill);

  return {
    update(time) {
      const intro = ease.outExpo(ease.clamp01(time / 3));
      const portrait = ctx.aspect < 0.9;
      const dist = (portrait ? 13 : 9.2) + (1 - intro) * 2.5;
      const angle = 0.25 + Math.sin(time * 0.08) * 0.22 + ctx.pointer.x * 0.12;
      camera.position.set(Math.sin(angle) * dist, 2.3 + ctx.pointer.y * 0.25, Math.cos(angle) * dist);
      camera.lookAt(0, portrait ? -0.6 : 1.5, 0);
      stump.layout(0.12, time);
      key.intensity = 300 * intro;
      rim.intensity = 50 * intro;
      fill.intensity = 8 * intro;
      fill.position.set(ctx.pointer.x * 4, 1.6 + ctx.pointer.y, 3.5);
      for (const f of fallen) {
        // failing seams: an uneven flicker
        const n = Math.sin(time * 3.1 + f.phase) * Math.sin(time * 7.3 + f.phase * 2.0);
        const v = 0.35 + 1.9 * Math.max(0, n);
        (f.ring.material as THREE.MeshBasicMaterial).color.set(COLORS.blueHi).multiplyScalar(v * intro);
      }
      motes.uniforms.uTime.value = time;
      grid.uniforms.uTime.value = time;
      grid.uniforms.uPower.value = intro;
    },
  };
}
