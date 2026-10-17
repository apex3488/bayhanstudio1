import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { HalfFloatType, Vector2 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/**
 * Selective-looking bloom without a second scene: only values above the threshold
 * (the HDR sensor, LEDs and halo, which skip tone mapping) are bright enough to glow.
 * Taking render priority 1 makes this composer the frame's only renderer.
 */
export function PostFX() {
  const getState = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const composer = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const { gl, scene, camera } = getState();
    const fx = new EffectComposer(gl);
    fx.renderTarget1.texture.type = HalfFloatType;
    fx.renderTarget2.texture.type = HalfFloatType;
    fx.addPass(new RenderPass(scene, camera));
    fx.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.6, 0.55, 0.9));
    fx.addPass(new OutputPass());
    composer.current = fx;
    return () => {
      fx.passes.forEach((pass) => pass.dispose());
      fx.dispose();
      composer.current = null;
    };
  }, [getState]);

  useEffect(() => {
    composer.current?.setPixelRatio(dpr);
    composer.current?.setSize(size.width, size.height);
  }, [size.width, size.height, dpr]);

  useFrame((_, delta) => {
    composer.current?.render(delta);
  }, 1);

  return null;
}
