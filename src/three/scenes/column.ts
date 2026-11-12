import * as THREE from "three";
import type { SceneCtx, SceneModule } from "../engine";
import { capitalGeometry, COLORS, drumGeometry, ease, lightMaterial, marbleMaterial, type MarbleMaterial } from "../kit";

/**
 * COLUMN — one column of six drums, one per service.
 * state.active (0..5, top to bottom) pulls a drum out and lights its veins.
 * In a tall viewport the column stands; in a wide one it lies on its side.
 */
export default function column(ctx: SceneCtx): SceneModule {
  const { scene, camera, mobile } = ctx;
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.02);
  ctx.bloom.strength = 0.6;
  ctx.bloom.radius = 0.7;
  ctx.bloom.threshold = 0.9;

  const COUNT = 6;
  const H = 0.82;
  const GAP = 0.09;
  const total = COUNT * H + (COUNT - 1) * GAP;
  const octaves = mobile ? 3 : 4;

  const root = new THREE.Group();
  scene.add(root);
  const geo = drumGeometry(20, 8, 0.075);

  type Drum = { mesh: THREE.Mesh; mat: MarbleMaterial; rings: THREE.Mesh[]; y: number; r: number; a: number };
  const drums: Drum[] = [];
  for (let i = 0; i < COUNT; i++) {
    // index 0 is the top drum
    const t = i / (COUNT - 1);
    const r = THREE.MathUtils.lerp(0.5, 0.58, t);
    const mat = marbleMaterial({ octaves, scale: 0.9 + i * 0.37, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(r, H, r);
    const y = total / 2 - H / 2 - i * (H + GAP);
    mesh.position.y = y;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    const rings = [-1, 1].map((s) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, 0.006, 6, 96), lightMaterial(COLORS.blueHi, 1));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y + s * (H / 2 + GAP / 2);
      root.add(ring);
      return ring;
    });
    drums.push({ mesh, mat, rings, y, r, a: 0 });
  }

  const cap = new THREE.Mesh(capitalGeometry(), marbleMaterial({ octaves, scale: 1.4 }));
  cap.scale.setScalar(0.5);
  cap.position.y = total / 2 + GAP;
  cap.castShadow = true;
  root.add(cap);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.16, 64),
    marbleMaterial({ octaves, scale: 0.6, color: 0xb4bcc9 }),
  );
  base.position.y = -total / 2 - GAP - 0.08;
  base.receiveShadow = true;
  root.add(base);

  scene.add(new THREE.HemisphereLight(0xb9c8e6, 0x05070c, 0.1));
  const key = new THREE.SpotLight(0xe2ebff, 260, 40, 0.5, 0.9, 2);
  key.position.set(-5, 5, 7);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const rim = new THREE.PointLight(COLORS.blue, 60, 30, 2);
  rim.position.set(4, 1, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(COLORS.ice, 8, 20, 2);
  scene.add(fill);

  const extent = total + 0.86 * 0.5 + 0.4;
  let lie = 0;

  return {
    update(time, dt) {
      const intro = ease.outExpo(ease.clamp01(time / 2.4));
      const k = 1 - Math.exp(-dt * 6);
      const active = ctx.state.active ?? -1;
      const wide = ctx.aspect > 1.25;
      lie += ((wide ? 1 : 0) - lie) * (dt >= 1 ? 1 : k);

      // stand in a tall panel, lie down in a wide strip
      root.rotation.z = (lie * Math.PI) / 2;
      root.rotation.y = wide ? 0 : -0.25 + ctx.pointer.x * 0.2;
      root.rotation.x = wide ? time * 0.08 : 0;

      const fov = THREE.MathUtils.degToRad(camera.fov / 2);
      const fit = wide ? extent / 2 / (Math.tan(fov) * ctx.aspect) : extent / 2 / Math.tan(fov);
      const dist = Math.max(fit * 1.12, 3.2 / (Math.tan(fov) * Math.max(ctx.aspect, 0.3)) * 0.5);
      camera.position.set(ctx.pointer.x * 0.4, ctx.pointer.y * 0.3 + (wide ? 0 : 0.2), dist + (1 - intro) * 3);
      camera.lookAt(0, 0, 0);

      fill.position.set(2 + ctx.pointer.x * 3, ctx.pointer.y * 3, 4);
      key.intensity = 260 * intro;
      rim.intensity = 60 * intro;

      drums.forEach((d, i) => {
        const on = i === active ? 1 : 0;
        d.a += (on - d.a) * (dt >= 1 ? 1 : k);
        const spread = (1 - intro) * (i - (COUNT - 1) / 2) * -0.5;
        d.mesh.position.y = d.y + spread;
        d.mesh.position.x = wide ? 0 : d.a * -0.32;
        d.mesh.position.z = d.a * 0.34;
        d.mesh.rotation.y = time * (0.06 + d.a * 0.5) * (i % 2 ? 1 : -1) + i;
        d.mat.userData.u.uGlow.value = d.a * 0.5;
        d.mat.userData.u.uTime.value = time;
        const dim = active < 0 ? 1 : 0.25 + d.a * 3.2;
        for (const ring of d.rings) {
          (ring.material as THREE.MeshBasicMaterial).color.set(COLORS.blueHi).multiplyScalar(dim);
          ring.position.x = d.mesh.position.x;
          ring.position.z = d.mesh.position.z;
        }
      });
    },
  };
}
