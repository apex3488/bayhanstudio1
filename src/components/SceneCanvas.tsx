"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Engine, SceneFactory } from "@/three/engine";

export type SceneName = "oracle" | "colonnade" | "column" | "portal" | "ruins";

const loaders: Record<SceneName, () => Promise<{ default: SceneFactory }>> = {
  oracle: () => import("@/three/scenes/oracle"),
  colonnade: () => import("@/three/scenes/colonnade"),
  column: () => import("@/three/scenes/column"),
  portal: () => import("@/three/scenes/portal"),
  ruins: () => import("@/three/scenes/ruins"),
};

/** Push a value into a running scene (e.g. the active service). */
export function setSceneState(scene: SceneName, key: string, value: number) {
  window.dispatchEvent(new CustomEvent("scene:state", { detail: { scene, key, value } }));
}

type Props = {
  scene: SceneName;
  label: string;
  className?: string;
  /** Shown until the scene is ready, and permanently when WebGL is unavailable. */
  fallback?: ReactNode;
};

export default function SceneCanvas({ scene, label, className, fallback }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "failed">("idle");

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let cancelled = false;
    let engine: Engine | null = null;
    const pending: Record<string, number> = {};

    const onState = (e: Event) => {
      const d = (e as CustomEvent<{ scene: SceneName; key: string; value: number }>).detail;
      if (d.scene !== scene) return;
      if (engine) engine.setState(d.key, d.value);
      else pending[d.key] = d.value;
    };
    window.addEventListener("scene:state", onState);

    const boot = async () => {
      try {
        const [{ Engine: EngineClass, webglAvailable }, { makeEnvironment }, mod] = await Promise.all([
          import("@/three/engine"),
          import("@/three/kit"),
          loaders[scene](),
        ]);
        if (cancelled) return;
        if (!webglAvailable()) {
          setStatus("failed");
          return;
        }
        const mobile = window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const stage = (el.closest("[data-stage]") as HTMLElement | null) ?? el;
        engine = new EngineClass(cv, stage, { mobile, reduced });
        engine.setEnvironment(makeEnvironment(engine.ctx.renderer), 0.22);
        for (const [k, v] of Object.entries(pending)) engine.setState(k, v);
        await engine.load(mod.default);
        if (cancelled) {
          engine.dispose();
          engine = null;
          return;
        }
        setStatus("ready");
      } catch (err) {
        console.warn(`[scene:${scene}] unavailable`, err);
        engine?.dispose();
        engine = null;
        if (!cancelled) setStatus("failed");
      }
    };

    // Let the page paint and become interactive before WebGL starts compiling.
    const idle = window.setTimeout(boot, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      window.removeEventListener("scene:state", onState);
      engine?.dispose();
      engine = null;
    };
  }, [scene]);

  return (
    <div ref={wrap} className={`scene ${className ?? ""}`} data-status={status}>
      <canvas ref={canvas} className="scene__canvas" role="img" aria-label={label} />
      {fallback ? (
        <div className="scene__fallback" aria-hidden="true">
          {fallback}
        </div>
      ) : null}
    </div>
  );
}
