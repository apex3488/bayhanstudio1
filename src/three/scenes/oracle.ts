import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { SceneCtx, SceneModule } from "../engine";
import { lightShafts, mirrorFloor, risingSparks } from "../fx";
import {
  arcBlockGeometry,
  buildColumns,
  COLORS,
  drumGeometry,
  dust,
  ease,
  floor,
  lightCone,
  lightMaterial,
  marbleMaterial,
  techGrid,
  type ColumnSpec,
} from "../kit";

/**
 * ORACLE — a classical bust inside a tholos of floating column drums.
 * A "digitisation" plane cuts through the sculpture: marble on one side,
 * hologram lines on the other. Scroll moves the plane and opens the temple.
 */
export default async function oracle(ctx: SceneCtx): Promise<SceneModule> {
  const { scene, camera, mobile } = ctx;
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.034);
  ctx.bloom.strength = 0.5;
  ctx.bloom.radius = 0.75;
  ctx.bloom.threshold = 0.9;

  const octaves = mobile ? 3 : 4;
  const stone = marbleMaterial({ seedAttr: true, octaves, roughness: 0.56 });
  const plain = marbleMaterial({ octaves, scale: 0.5, roughness: 0.5, color: 0xc9ccd3 });
  const seam = lightMaterial(COLORS.blueHi, 1.7);

  /* ---------- ground: polished floor + three-step stylobate ---------- */
  scene.add(floor(46, -0.45));
  // polished stone: the temple is mirrored in the floor (desktop only — it costs a second pass)
  if (!mobile) scene.add(mirrorFloor(30, -0.447, 0.36));
  for (let i = 0; i < 3; i++) {
    const r = 5.5 - i * 0.36;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.15, 96), plain);
    step.position.y = -0.375 + i * 0.15;
    step.receiveShadow = true;
    step.castShadow = true;
    scene.add(step);
  }
  // inlaid lines of light on the stylobate
  for (const r of [1.35, 3.25]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.008, 128), lightMaterial(COLORS.blue, 1.1));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.004;
    scene.add(ring);
  }

  /* ---------- tholos: ring of columns, open towards the viewer ---------- */
  const N = mobile ? 8 : 10;
  const R = 4.05;
  const specs: ColumnSpec[] = [];
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI * 2;
    if (Math.cos(a) > 0.72) continue; // leave the front open
    specs.push({ x: Math.sin(a) * R, z: Math.cos(a) * R, phase: k * 1.31 });
  }
  const columns = buildColumns(specs, { material: stone, seam, shadows: true });
  scene.add(columns.group);

  /* ---------- a second, colossal ring far behind: scale and depth ---------- */
  const farSpecs: ColumnSpec[] = [];
  const farN = mobile ? 10 : 16;
  for (let k = 0; k < farN; k++) {
    const a = ((k + 0.5) / farN) * Math.PI * 2;
    if (Math.cos(a) > 0.45) continue;
    farSpecs.push({ x: Math.sin(a) * 10.5, z: Math.cos(a) * 10.5, phase: k * 0.77, y: -0.45 });
  }
  const farColumns = buildColumns(farSpecs, {
    material: stone,
    seam,
    drums: 9,
    drumH: 1.05,
    rBase: 0.62,
    rTop: 0.52,
    shadows: false,
  });
  scene.add(farColumns.group);

  /* ---------- fragmented entablature ---------- */
  const blocks: { mesh: THREE.Mesh; y: number; phase: number; tilt: number }[] = [];
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    if (i === 1) continue; // a missing piece
    const len = (Math.PI * 2) / segs;
    const start = i * len + 0.09 + Math.PI / 2 + len / 2;
    const mesh = new THREE.Mesh(arcBlockGeometry(R - 0.5, R + 0.5, 0.46, start, len - 0.18), plain);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    blocks.push({ mesh, y: columns.height + 0.14, phase: i * 2.1, tilt: (i % 2 ? 1 : -1) * 0.03 });
  }

  /* ---------- pedestal + bust ---------- */
  const pedestalGeo = drumGeometry(24, 6, 0.05);
  const pedestal = new THREE.Mesh(pedestalGeo, plain);
  pedestal.scale.set(0.78, 0.7, 0.78);
  pedestal.position.y = 0.35;
  pedestal.castShadow = pedestal.receiveShadow = true;
  scene.add(pedestal);

  const bustPivot = new THREE.Group();
  bustPivot.position.y = 0.7;
  scene.add(bustPivot);

  const bustMat = marbleMaterial({ holo: true, octaves, scale: 7, roughness: 0.4, color: 0xf0f1f4, polish: 0.6 });
  const bu = bustMat.userData.u;
  bu.uHoloOrigin.value.set(0, 1.95, 0);

  const gltf = await new GLTFLoader().loadAsync("/models/bust/bust.gltf");
  let bustMesh: THREE.Mesh | null = null;
  gltf.scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !bustMesh) bustMesh = o as THREE.Mesh;
  });
  if (bustMesh) {
    const mesh = bustMesh as THREE.Mesh;
    const src = mesh.material as THREE.MeshStandardMaterial;
    if (src.normalMap) {
      bustMat.normalMap = src.normalMap;
      bustMat.normalScale.set(0.9, 0.9);
    }
    src.dispose();
    mesh.material = bustMat;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const k = 2.1 / size.y;
    gltf.scene.scale.setScalar(k);
    gltf.scene.position.y = -box.min.y * k;
    bustPivot.add(gltf.scene);
  }

  /* ---------- orbital instruments ---------- */
  const rings = new THREE.Group();
  rings.position.set(0, 1.95, 0);
  scene.add(rings);
  const ringDefs = [
    { r: 1.62, tube: 0.006, tilt: [1.2, 0.2], speed: 0.16, color: COLORS.blueHi, k: 2.6 },
    { r: 1.98, tube: 0.004, tilt: [1.75, -0.5], speed: -0.11, color: COLORS.ice, k: 1.6 },
    { r: 2.42, tube: 0.008, tilt: [1.45, 0.9], speed: 0.07, color: COLORS.blue, k: 3.0 },
  ];
  const ringMeshes = ringDefs.map((d) => {
    const holder = new THREE.Group();
    holder.rotation.set(d.tilt[0], d.tilt[1], 0);
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 8, 220), lightMaterial(d.color, d.k));
    holder.add(mesh);
    // a single bead travelling along each ring
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), lightMaterial(COLORS.ice, 4));
    bead.position.x = d.r;
    mesh.add(bead);
    rings.add(holder);
    return { mesh, speed: d.speed };
  });

  // graduated dial on the floor
  const tickCount = 144;
  const ticks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.008, 0.004, 1),
    lightMaterial(COLORS.ice, 1.3),
    tickCount,
  );
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      const len = i % 12 === 0 ? 0.34 : i % 3 === 0 ? 0.16 : 0.08;
      q.setFromAxisAngle(up, a);
      m.compose(
        new THREE.Vector3(Math.sin(a) * (2.75 - len / 2), 0.006, Math.cos(a) * (2.75 - len / 2)),
        q,
        new THREE.Vector3(1, 1, len),
      );
      ticks.setMatrixAt(i, m);
    }
  }
  const dial = new THREE.Group();
  dial.add(ticks);
  scene.add(dial);

  // measuring grid radiating from the sculpture, a scanner ring and a cone of light
  const grid = techGrid(34, -0.445);
  scene.add(grid.mesh);
  const innerGrid = techGrid(5.1, 0.006);
  scene.add(innerGrid.mesh);
  const scan = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.007, 8, 160), lightMaterial(COLORS.ice, 3.2));
  scan.rotation.x = Math.PI / 2;
  scene.add(scan);
  const scanDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 96),
    new THREE.MeshBasicMaterial({
      color: COLORS.blueHi,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scanDisc.rotation.x = Math.PI / 2;
  scene.add(scanDisc);
  const cone = lightCone(8.5, 2.6);
  scene.add(cone.mesh);

  const shafts = lightShafts(new THREE.Vector3(-5.5, 9, 6.5), new THREE.Vector3(0.4, 0, -0.4), mobile ? 4 : 7, 3.2);
  scene.add(shafts.group);
  const sparks = risingSparks(mobile ? 90 : 220, 1.5, 3.8);
  sparks.points.position.y = 0.5;
  scene.add(sparks.points);

  const motes = dust(mobile ? 160 : 380, new THREE.Vector3(12, 7, 12), new THREE.Vector3(0, 3, 0));
  scene.add(motes.points);

  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight(0xb9c8e6, 0x05070c, 0.08));

  const key = new THREE.SpotLight(0xf1f4fa, 0, 40, 0.78, 0.9, 2);
  key.position.set(-5.5, 8.5, 6.5);
  key.target.position.set(0, 1.6, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.camera.near = 4;
  key.shadow.camera.far = 22;
  scene.add(key, key.target);

  // blue is a narrow rim on the sculpture only — never a wash over the temple
  const rim = new THREE.SpotLight(COLORS.blue, 0, 20, 0.3, 0.7, 2);
  rim.position.set(3.8, 3.6, -3.6);
  rim.target.position.set(0, 2.1, 0);
  scene.add(rim, rim.target);

  const fill = new THREE.PointLight(COLORS.ice, 0, 18, 2);
  scene.add(fill);

  const core = new THREE.PointLight(COLORS.blueHi, 0, 9, 2);
  core.position.set(0, 0.25, 1.1);
  scene.add(core);

  /* ---------- camera rig ---------- */
  const look = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  let smoothP = 0;

  const update = (time: number, dt: number) => {
    const intro = ease.outExpo(ease.clamp01(time / 3.2));
    const introLin = ease.inOut(ease.clamp01(time / 2.6));
    smoothP += (ctx.progress - smoothP) * (1 - Math.exp(-dt * 5));
    const p = smoothP;
    const pe = ease.inOut(p);
    const portrait = ctx.aspect < 0.9;
    const px = ctx.pointer.x;
    const py = ctx.pointer.y;

    // camera: reveal dolly on entry, slow orbit + push-in on scroll
    const dist = (portrait ? 12.2 : 8.9) + (1 - intro) * -3.6 - pe * (portrait ? 0.9 : 1.1);
    const angle = (portrait ? 0 : -0.16) + (1 - intro) * 0.5 + pe * 0.78 + px * 0.05;
    const height = 1.75 - (1 - intro) * 1.25 + pe * 0.7 + py * 0.12;
    camPos.set(Math.sin(angle) * dist, height, Math.cos(angle) * dist);
    camera.position.copy(camPos);

    // on wide screens the sculpture sits right of centre, leaving room for type
    const side = portrait ? 0 : THREE.MathUtils.lerp(-1.75, -1.35, pe);
    // on tall screens the camera looks low, lifting the sculpture into the upper half above the type
    look.set(Math.cos(angle) * side, portrait ? 0.25 + pe * 0.9 : 1.82 + pe * 0.2, -Math.sin(angle) * side);
    camera.lookAt(look);

    // light comes up with the reveal; cursor carries a soft ice fill
    key.intensity = 330 * introLin;
    rim.intensity = 260 * introLin;
    fill.intensity = 9 * introLin;
    core.intensity = 5 * introLin * (0.8 + 0.2 * Math.sin(time * 1.3));
    fill.position.set(1.6 + px * 2.6, 2.3 + py * 1.3, 3.4);

    // digitisation plane: the bust condenses out of light, scroll dissolves it back
    const holoIntro = THREE.MathUtils.lerp(-1.7, 0.52, ease.inOut(ease.clamp01((time - 0.3) / 2.6)));
    bu.uHolo.value = holoIntro - pe * 1.5 + py * 0.05;
    bu.uTime.value = time;
    bustPivot.rotation.y = -0.32 + px * 0.34 + pe * 0.5 + Math.sin(time * 0.2) * 0.03;

    // temple opens up
    columns.layout(pe * 0.8 + (1 - intro) * 0.35, time);
    for (const b of blocks) {
      b.mesh.position.y = b.y + Math.sin(time * 0.4 + b.phase) * 0.05 + pe * (0.5 + (b.phase % 1) * 0.6);
      b.mesh.rotation.z = b.tilt * (1 + pe * 3) + Math.sin(time * 0.3 + b.phase) * 0.008;
      b.mesh.rotation.x = Math.cos(time * 0.27 + b.phase) * 0.008 + pe * b.tilt * 2;
    }

    rings.scale.setScalar((0.6 + 0.4 * intro) * (1 + pe * 0.3));
    rings.rotation.y = px * 0.32;
    rings.rotation.x = -py * 0.18;
    for (const r of ringMeshes) r.mesh.rotation.z = time * r.speed;
    dial.rotation.y = time * 0.03 + pe * 0.6;
    grid.uniforms.uTime.value = time;
    grid.uniforms.uPower.value = introLin;
    innerGrid.uniforms.uTime.value = time + 3.0;
    innerGrid.uniforms.uPower.value = introLin * 0.8;
    // the scanner sweeps the sculpture, slowing at the ends
    const sweep = 0.5 - 0.5 * Math.cos(time * 0.7);
    scan.position.y = scanDisc.position.y = 0.85 + sweep * 2.0;
    const sr = 0.62 + 0.4 * Math.sin(sweep * Math.PI);
    scan.scale.setScalar(sr * introLin + 0.001);
    scanDisc.scale.setScalar(sr * introLin + 0.001);
    cone.uniforms.uPower.value = introLin * (1 - pe * 0.5);
    cone.uniforms.uTime.value = time;
    shafts.uniforms.uTime.value = time;
    shafts.uniforms.uPower.value = introLin * (1 - pe * 0.4);
    // the more of the sculpture is digitised, the more data rises from it
    sparks.uniforms.uTime.value = time;
    sparks.uniforms.uPower.value = introLin * (0.45 + pe * 0.9);
    farColumns.layout(pe * 0.5 + (1 - intro) * 0.6, time * 0.7);
    motes.uniforms.uTime.value = time;
  };

  return { update };
}
