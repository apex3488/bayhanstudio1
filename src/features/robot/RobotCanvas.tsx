import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useRobotMaterials } from './materials';
import { trackPointer } from './pointer';
import { SentinelHead } from './SentinelHead';

interface RobotCanvasProps {
  className?: string;
  visible: boolean;
  onReady: () => void;
  onContextLost: () => void;
}

/** Neutral studio reflections generated on the GPU — no HDR file to download. */
function StudioEnvironment() {
  const getState = useThree((s) => s.get);

  useEffect(() => {
    // Three.js scene objects are mutable by design; read them from the store inside the effect.
    const { gl, scene } = getState();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.38;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
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
    if (frames.current === 3) onReady();
  });
  return null;
}

/**
 * Compiles every shader before the first frame — in parallel where the GPU driver
 * supports KHR_parallel_shader_compile — instead of stalling the main thread on frame one.
 * Must be the last child of the scene so materials and the environment exist.
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
 * Development helper: `await window.__bayhanCapturePoster()` renders the current
 * frame at 1200×1200 and the dev server saves it as public/robot/poster.webp.
 */
function PosterCapture() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const setDpr = useThree((s) => s.setDpr);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const win = window as Window & { __bayhanCapturePoster?: () => Promise<number> };
    win.__bayhanCapturePoster = async () => {
      setDpr(1200 / size.width);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      gl.render(scene, camera);
      const blob = await new Promise<Blob | null>((r) =>
        gl.domElement.toBlob(r, 'image/webp', 0.86),
      );
      if (!blob) throw new Error('Canvas capture failed');
      const response = await fetch('/__dev/robot-poster', { method: 'POST', body: blob });
      return response.status;
    };
    return () => {
      delete win.__bayhanCapturePoster;
    };
  }, [gl, scene, camera, size.width, setDpr]);

  return null;
}

function Scene({
  onReady,
  onCompiled,
  maxDpr,
}: {
  onReady: () => void;
  onCompiled: () => void;
  maxDpr: number;
}) {
  const materials = useRobotMaterials();
  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.04} />
      {/* Key: cold white from upper left, where the headline sits */}
      <directionalLight position={[-3, 4, 5]} intensity={2.8} color="#e6edff" />
      {/* Top: a thin highlight along the crown ridges */}
      <directionalLight position={[0.5, 6, 0.5]} intensity={0.9} color="#f4f7fc" />
      {/* Rims: brand blue from behind, grazing only the edges of the silhouette */}
      <directionalLight position={[3, 1.8, -6]} intensity={4.5} color="#3478F6" />
      <directionalLight position={[-3.5, 0, -5]} intensity={1.6} color="#2f62c9" />
      {/* Sensor spill on the jaw plate */}
      <pointLight position={[0, 0.1, 1.6]} intensity={1.4} distance={2.4} color="#3478F6" />
      <SentinelHead materials={materials} />
      <AdaptiveResolution maxDpr={maxDpr} />
      <PointerTracking />
      <ReadySignal onReady={onReady} />
      {import.meta.env.DEV && <PosterCapture />}
      <ShaderWarmup onCompiled={onCompiled} />
    </>
  );
}

export default function RobotCanvas({
  className,
  visible,
  onReady,
  onContextLost,
}: RobotCanvasProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [compiled, setCompiled] = useState(false);
  const markCompiled = useCallback(() => setCompiled(true), []);
  const [maxDpr] = useState(() => (window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75));

  // Render only while the stage is on screen and the tab is visible.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    let inView = true;
    const update = () => setActive(inView && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <div ref={wrapper} className={className} data-visible={visible || undefined}>
      <Canvas
        frameloop={active && compiled ? 'always' : 'never'}
        dpr={[1, maxDpr]}
        camera={{ position: [0, 0.05, 6.6], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onContextLost();
          });
        }}
      >
        <Scene onReady={onReady} onCompiled={markCompiled} maxDpr={maxDpr} />
      </Canvas>
    </div>
  );
}
