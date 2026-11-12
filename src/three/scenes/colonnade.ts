import * as THREE from "three";
import type { SceneCtx, SceneModule } from "../engine";
import { mirrorFloor } from "../fx";
import { buildColumns, COLORS, dust, ease, floor, lightMaterial, marbleMaterial, techGrid, type ColumnSpec } from "../kit";

/** COLONNADE — a corridor of columns receding towards a slit of blue light. */
export default function colonnade(ctx: SceneCtx): SceneModule {
  const { scene, camera, mobile } = ctx;
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.042);
  ctx.bloom.strength = 0.7;
  ctx.bloom.radius = 0.85;
  ctx.bloom.threshold = 0.88;

  const octaves = mobile ? 3 : 4;
  const stone = marbleMaterial({ seedAttr: true, octaves });
  const plain = marbleMaterial({ octaves, scale: 0.35, color: 0xb4bcc9 });

  scene.add(floor(60, 0));
  if (!mobile) {
    const mirror = mirrorFloor(46, 0.002, 0.4);
    mirror.position.z = -10;
    scene.add(mirror);
  }
  const grid = techGrid(40, 0.004);
  grid.mesh.position.z = -10;
  scene.add(grid.mesh);

  const pairs = mobile ? 7 : 9;
  const spacing = 3.1;
  const half = 2.7;
  const specs: ColumnSpec[] = [];
  for (let i = 0; i < pairs; i++) {
    for (const sx of [-1, 1]) specs.push({ x: sx * half, z: 3 - i * spacing, phase: i * 0.8 + sx });
  }
  const columns = buildColumns(specs, {
    material: stone,
    seam: lightMaterial(COLORS.blueHi, 1.8),
    drums: 6,
    drumH: 0.92,
    rBase: 0.42,
    rTop: 0.35,
    gap: 0.02,
  });
  scene.add(columns.group);

  const length = pairs * spacing + 2;
  for (const sx of [-1, 1]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.6, length), plain);
    beam.position.set(sx * half, columns.height + 0.32, 3 - ((pairs - 1) * spacing) / 2);
    beam.castShadow = beam.receiveShadow = true;
    scene.add(beam);
  }

  // the destination: a tall slit of light
  const endZ = 3 - pairs * spacing - 3;
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 9), lightMaterial(COLORS.blueHi, 3.2));
  slit.position.set(0, 4.5, endZ);
  scene.add(slit);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 12),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; void main(){ float d = abs(vUv.x - 0.5) * 2.0; float a = pow(1.0 - d, 3.0) * smoothstep(0.0, 0.25, vUv.y) * 0.5; gl_FragColor = vec4(vec3(0.08, 0.42, 1.0) * a, a); }`,
    }),
  );
  halo.position.set(0, 4.5, endZ + 0.05);
  scene.add(halo);

  // floor inlay leading to the light
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.014, length + 6), lightMaterial(COLORS.blue, 1.8));
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.004, 3 - length / 2);
  scene.add(line);

  const motes = dust(mobile ? 140 : 320, new THREE.Vector3(7, 6, length), new THREE.Vector3(0, 3, 3 - length / 2));
  scene.add(motes.points);

  scene.add(new THREE.HemisphereLight(0xb9c8e6, 0x05070c, 0.1));
  const sun = new THREE.DirectionalLight(0xe2ebff, 1.9);
  sun.position.set(-9, 11, 2);
  sun.target.position.set(0, 0, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  const glow = new THREE.PointLight(COLORS.blue, 160, 60, 2);
  glow.position.set(0, 4, endZ + 1.5);
  scene.add(glow);

  const look = new THREE.Vector3();
  let sp = 0;

  return {
    update(time, dt) {
      const intro = ease.outExpo(ease.clamp01(time / 3));
      sp += (ctx.progress - sp) * (1 - Math.exp(-dt * 4));
      const portrait = ctx.aspect < 0.9;
      camera.fov = portrait ? 52 : 34;
      camera.updateProjectionMatrix();
      const z = 10.5 - intro * 2 - ease.inOut(sp) * 13;
      camera.position.set(ctx.pointer.x * 0.5, 1.7 + ctx.pointer.y * 0.2 + sp * 0.5, z);
      look.set(ctx.pointer.x * -0.4, 2.7 + sp * 0.4, z - 12);
      camera.lookAt(look);
      columns.layout(sp * 0.25, time);
      sun.intensity = 1.9 * intro;
      glow.intensity = 160 * intro * (0.92 + 0.08 * Math.sin(time * 1.1));
      motes.uniforms.uTime.value = time;
      grid.uniforms.uTime.value = time;
      grid.uniforms.uPower.value = intro * 0.8;
    },
  };
}
