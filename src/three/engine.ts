import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  bloom: UnrealBloomPass;
  /** Coarse-pointer / small-screen device: lighter geometry and shadows. */
  mobile: boolean;
  reduced: boolean;
  /** Smoothed pointer, -1..1 on both axes (y up). */
  pointer: THREE.Vector2;
  /** Scroll progress of the stage element, 0..1. */
  progress: number;
  aspect: number;
  /** External state pushed from the page (e.g. the active service index). */
  state: Record<string, number>;
}

export interface SceneModule {
  update(time: number, dt: number): void;
  resize?(): void;
}

export type SceneFactory = (ctx: SceneCtx) => SceneModule | Promise<SceneModule>;

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uGrain: { value: 0.045 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float d = dot(c, c);
      // a breath of chromatic separation towards the corners
      vec2 off = c * d * 0.012;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - off).b
      );
      col *= mix(1.0, 0.42, smoothstep(0.08, 0.62, d));
      col += (hash(gl_FragCoord.xy) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") as WebGL2RenderingContext | null);
  } catch {
    return false;
  }
}

export class Engine {
  readonly ctx: SceneCtx;
  private composer: EffectComposer;
  private grade: ShaderPass;
  private module: SceneModule | null = null;
  private raf = 0;
  private running = false;
  private visible = true;
  private disposed = false;
  private last = 0;
  private time = 0;
  private target = new THREE.Vector2();
  private pixelRatio: number;
  private slowFrames = 0;
  private frames = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private envTarget: THREE.WebGLRenderTarget | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private stage: HTMLElement,
    opts: { mobile: boolean; reduced: boolean },
  ) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    renderer.setClearColor(0x050609, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75);
    renderer.setPixelRatio(this.pixelRatio);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050609);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

    const rt = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      samples: opts.mobile ? 2 : 4,
    });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.5, 0.7, 0.92);
    this.composer.addPass(bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);

    this.ctx = {
      renderer,
      scene,
      camera,
      bloom,
      mobile: opts.mobile,
      reduced: opts.reduced,
      pointer: new THREE.Vector2(),
      progress: 0,
      aspect: 1,
      state: {},
    };

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        this.sync();
      },
      { rootMargin: "80px" },
    );
    this.io.observe(canvas);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    document.addEventListener("visibilitychange", this.sync);
    canvas.addEventListener("webglcontextlost", this.onLost);
  }

  setEnvironment(target: THREE.WebGLRenderTarget, intensity = 0.4) {
    this.envTarget = target;
    this.ctx.scene.environment = target.texture;
    this.ctx.scene.environmentIntensity = intensity;
  }

  async load(factory: SceneFactory) {
    this.resize();
    const mod = await factory(this.ctx);
    if (this.disposed) return;
    this.module = mod;
    this.resize();
    if (this.ctx.reduced) this.renderStill();
    else this.sync();
  }

  setState(key: string, value: number) {
    this.ctx.state[key] = value;
    if (this.ctx.reduced) this.renderStill();
  }

  /** One finished frame, used for prefers-reduced-motion. */
  private renderStill() {
    if (!this.module || this.disposed) return;
    this.updateProgress();
    this.module.update(60, 0);
    this.module.update(60, 1);
    this.composer.render();
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    this.target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };

  private onLost = (e: Event) => {
    e.preventDefault();
    this.running = false;
    cancelAnimationFrame(this.raf);
  };

  private sync = () => {
    if (this.disposed || !this.module || this.ctx.reduced) return;
    const should = this.visible && !document.hidden;
    if (should && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  };

  private updateProgress() {
    const r = this.stage.getBoundingClientRect();
    const vh = window.innerHeight;
    let travel = r.height - vh;
    if (travel < 80) travel = r.height;
    this.ctx.progress = Math.min(1, Math.max(0, -r.top / travel));
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const rawDt = (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(rawDt, 0.1);
    this.time += dt;

    const k = 1 - Math.exp(-dt * 4);
    this.ctx.pointer.lerp(this.target, k);
    this.updateProgress();

    this.module!.update(this.time, dt);
    this.grade.uniforms.uTime.value = this.time % 10;
    this.composer.render();

    // Adaptive resolution: step down when frames stay slow.
    this.frames++;
    if (rawDt > 0.026) this.slowFrames++;
    if (this.frames >= 90) {
      if (this.slowFrames > 45 && this.pixelRatio > 0.8) {
        this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.25);
        this.ctx.renderer.setPixelRatio(this.pixelRatio);
        this.resize();
      }
      this.frames = 0;
      this.slowFrames = 0;
    }
  };

  private resize() {
    if (this.disposed) return;
    const host = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    const { renderer, camera } = this.ctx;
    renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
    this.ctx.aspect = w / h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    this.module?.resize?.();
    if (this.ctx.reduced) this.renderStill();
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener("pointermove", this.onPointer);
    document.removeEventListener("visibilitychange", this.sync);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);

    const textures = new Set<THREE.Texture>();
    this.ctx.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const m of mats) {
        for (const value of Object.values(m as unknown as Record<string, unknown>)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
        m.dispose();
      }
      (obj as THREE.SpotLight).shadow?.map?.dispose?.();
      (obj as THREE.InstancedMesh).dispose?.();
    });
    textures.forEach((t) => t.dispose());
    this.envTarget?.dispose();
    this.composer.dispose();
    this.ctx.renderer.dispose();
  }
}
