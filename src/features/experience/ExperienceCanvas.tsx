import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Color, FogExp2, PMREMGenerator, type DirectionalLight, type PointLight } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Halo, Particles } from './Atmosphere';
import { CameraRig, headAnchor } from './CameraRig';
import { useRobotMaterials } from './materials';
import { trackPointer } from './pointer';
import { PostFX } from './PostFX';
import { markSceneReady, sceneReady, sceneState } from './sceneState';
import { SentinelHead } from './SentinelHead';

/** Scene background: the void colour, compensated for ACES tone mapping darkening it. */
const VOID = '#07090e';

interface ExperienceCanvasProps {
  className?: string;
  /** false while the layer is faded out: the render loop stops entirely */
  active: boolean;
  tier: 'high' | 'low';
  compact: boolean;
  onReady: () => void;
  onContextLost: () => void;
}

/** Studio reflections generated on the GPU — no HDR file to download. Fog adds depth. */
function Stage() {
  const getState = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = getState();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.24;
    scene.background = new Color(VOID);
    scene.fog = new FogExp2(VOID, 0.05);
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      scene.background = null;
      scene.fog = null;
      envMap.dispose();
    };
  }, [getState]);
  return null;
}

/** Lowers the pixel ratio step by step if the device cannot hold ~45 fps. */
function AdaptiveResolution({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useRef(maxDpr);
  const sample = useRef({ frames: 0, time: 0 });
  useFrame((_, delta) => {
    const s = sample.current;
    s.frames += 1;
    s.time += delta;
    if (s.frames < 90) return;
    const avg = s.time / s.frames;
    s.frames = 0;
    s.time = 0;
    if (avg > 1 / 45 && dpr.current > 1) {
      dpr.current = Math.max(1, dpr.current - 0.25);
      setDpr(dpr.current);
    }
  });
  return null;
}

/** Reports readiness after a few rendered frames so the fade-in never shows a blank canvas. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) {
      markSceneReady();
      onReady();
    }
  });
  return null;
}

/**
 * Compiles every shader before the first frame — in parallel where the driver
 * supports KHR_parallel_shader_compile. Must be the last child of the scene.
 */
function ShaderWarmup({ onCompiled }: { onCompiled: () => void }) {
  const getState = useThree((s) => s.get);
  useEffect(() => {
    let alive = true;
    const { gl, scene, camera } = getState();
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (alive) onCompiled();
      });
    return () => {
      alive = false;
    };
  }, [getState, onCompiled]);
  return null;
}

function PointerTracking() {
  const clock = useThree((s) => s.clock);
  useEffect(() => trackPointer(() => clock.elapsedTime), [clock]);
  return null;
}

/**
 * Development helper: `await __bayhanCapture('poster-desktop', 1920)` renders the
 * current frame at the given width and the dev server saves it to public/media/.
 */
function FrameCapture() {
  const getState = useThree((s) => s.get);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const win = window as Window & {
      __bayhanCapture?: (name: string, width: number, quality?: number) => Promise<number>;
      __bayhanScene?: typeof sceneState;
    };
    win.__bayhanScene = sceneState;
    win.__bayhanCapture = async (name, width, quality = 0.84) => {
      const { size, setDpr } = getState();
      setDpr(width / size.width);
      await new Promise((r) => setTimeout(r, 250));
      // Re-read after the resize; one plain render (no bloom) is enough for a still.
      const { gl, scene, camera } = getState();
      const shot = sceneState.override;
      if (shot) {
        camera.position.set(...shot.position);
        camera.lookAt(...shot.target);
        camera.updateMatrixWorld();
      }
      gl.render(scene, camera);
      const blob = await new Promise<Blob | null>((r) =>
        gl.domElement.toBlob(r, 'image/webp', quality),
      );
      if (!blob) throw new Error('Canvas capture failed');
      const res = await fetch(`/__dev/capture?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        body: blob,
      });
      return res.status;
    };

    // `?capture=<set>`: render a predefined set of stills, then flag completion in the title.
    const set = new URLSearchParams(window.location.search).get('capture');
    let cancelled = false;
    if (set) {
      void import('./captureShots').then(async ({ CAPTURE_SETS }) => {
        const shots = CAPTURE_SETS[set] ?? [];
        await sceneReady;
        sceneState.pose = { x: -0.45, y: 0.05 };
        await new Promise((r) => setTimeout(r, 2500));
        const results: string[] = [];
        for (const shot of shots) {
          if (cancelled) return;
          sceneState.override = { position: shot.position, target: shot.target };
          await new Promise((r) => setTimeout(r, 400));
          results.push(`${shot.name}:${await win.__bayhanCapture?.(shot.name, shot.width)}`);
        }
        document.title = `CAPTURE-DONE ${results.join(' ')}`;
      });
    }

    return () => {
      cancelled = true;
      delete win.__bayhanCapture;
      delete win.__bayhanScene;
    };
  }, [getState]);
  return null;
}

function Scene({
  tier,
  compact,
  onReady,
  onCompiled,
  maxDpr,
}: {
  tier: 'high' | 'low';
  compact: boolean;
  onReady: () => void;
  onCompiled: () => void;
  maxDpr: number;
}) {
  const materials = useRobotMaterials();
  const sweep = useRef<PointLight>(null);
  const spill = useRef<DirectionalLight>(null);
  const [hx, hy, hz] = headAnchor(compact);

  return (
    <>
      <Stage />
      <ambientLight intensity={0.03} />
      {/* Key: cold white from upper left, where the headline sits */}
      <directionalLight position={[-3, 4, 5]} intensity={2.1} color="#e6edff" />
      {/* Top: a thin highlight along the crown ridges */}
      <directionalLight position={[0.5, 6, 0.5]} intensity={0.4} color="#f4f7fc" />
      {/* Rims: brand blue from behind, grazing only the edges of the silhouette */}
      <directionalLight
        ref={spill}
        position={[hx + 2.2, 2.2, -8]}
        intensity={3.2}
        color="#3478F6"
      />
      <directionalLight position={[hx - 3.5, 0, -5]} intensity={1.4} color="#2f62c9" />
      {/* Sweep: blue light travelling across the face plates */}
      <pointLight
        ref={sweep}
        position={[hx, hy + 0.6, 1.8]}
        intensity={6}
        distance={5}
        color="#5a91f8"
      />
      {/* Sensor spill on the jaw plate */}
      <pointLight position={[hx, hy + 0.1, 1.6]} intensity={1.3} distance={2.4} color="#3478F6" />

      <group position={[hx, hy, hz]}>
        <SentinelHead materials={materials} />
        <Halo />
      </group>
      <Particles count={tier === 'high' ? 1400 : 500} />

      <CameraRig sweep={sweep} spill={spill} />
      {tier === 'high' && <PostFX />}
      <AdaptiveResolution maxDpr={maxDpr} />
      <PointerTracking />
      <ReadySignal onReady={onReady} />
      {import.meta.env.DEV && <FrameCapture />}
      <ShaderWarmup onCompiled={onCompiled} />
    </>
  );
}

export default function ExperienceCanvas({
  className,
  active,
  tier,
  compact,
  onReady,
  onContextLost,
}: ExperienceCanvasProps) {
  const [compiled, setCompiled] = useState(false);
  const markCompiled = useCallback(() => setCompiled(true), []);
  const [visible, setVisible] = useState(true);
  const maxDpr = tier === 'high' ? 1.6 : 1.3;

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <Canvas
      className={className}
      frameloop={active && visible && compiled ? 'always' : 'never'}
      dpr={[1, maxDpr]}
      camera={{ position: [0.1, 0.15, 7.4], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: tier === 'high', alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <Scene
        tier={tier}
        compact={compact}
        onReady={onReady}
        onCompiled={markCompiled}
        maxDpr={maxDpr}
      />
    </Canvas>
  );
}
