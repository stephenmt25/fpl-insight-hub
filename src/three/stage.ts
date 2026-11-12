import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Pointer position in [-1, 1], eased. */
  pointer: THREE.Vector2;
}

export interface StageOptions {
  fov?: number;
  far?: number;
  /** Adds a studio environment map so metal surfaces have something to reflect. */
  reflections?: boolean;
  /**
   * For a scene that fills the window and runs behind everything else: trade
   * resolution for frame rate when the GPU can't keep up, and win it back when it can.
   */
  adaptive?: boolean;
  setup: (stage: Stage) => (time: number, delta: number) => void;
}

/** Never render a full-window scene coarser than this share of a CSS pixel. */
const MIN_RATIO = 0.6;
/** Shortest gap between frames: every frame on a 60-90 Hz display, every other one at 120-144 Hz. */
const MIN_FRAME_MS = 10.5;

/**
 * Mounts a WebGL scene into `container` and returns a cleanup function.
 * Handles resize, pauses when hidden or off-screen, renders a single still
 * frame under prefers-reduced-motion, and disposes every GPU resource.
 */
export function mountStage(container: HTMLElement, { fov = 40, far = 200, reflections = false, adaptive = false, setup }: StageOptions): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return () => {}; // No WebGL: the page works without the scene
  }
  // A full-window backdrop starts at one sample per CSS pixel and earns more; small scenes are cheap enough to be sharp
  const maxRatio = Math.min(window.devicePixelRatio, adaptive ? 1.5 : 2);
  let ratio = adaptive ? Math.min(maxRatio, 1) : maxRatio;
  renderer.setPixelRatio(ratio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.5, far);
  let envTarget: THREE.WebGLRenderTarget | null = null;
  if (reflections) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();
  }

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const onPointer = (e: PointerEvent) => {
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const update = setup({ scene, camera, renderer, pointer });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  io.observe(container);

  // Adaptive resolution, judged over windows of a second and a half. Two slow
  // windows in a row lower it (one alone is usually the page doing something);
  // three quick ones raise it again, but never back to a level that proved too much.
  let span = 0;
  let frames = 0;
  let slow = 0;
  let quick = 0;
  let ceiling = maxRatio;
  const setRatio = (next: number) => {
    ratio = next;
    renderer.setPixelRatio(ratio); // also resizes the drawing buffer
  };
  const tune = (gap: number) => {
    if (gap > 250) return; // a stall (tab switch, a long script), not the GPU
    span += gap;
    frames++;
    if (span < 1500) return;
    const average = span / frames;
    span = frames = 0;
    if (average > 22) {
      quick = 0;
      if (++slow >= 2 && ratio > MIN_RATIO) {
        ceiling = Math.max(MIN_RATIO, ratio * 0.95);
        setRatio(Math.max(MIN_RATIO, ratio * 0.85));
        slow = 0;
      }
    } else if (average < 18) {
      slow = 0;
      if (++quick >= 3 && ratio < ceiling) {
        setRatio(Math.min(ceiling, ratio * 1.12));
        quick = 0;
      }
    } else {
      slow = quick = 0;
    }
  };

  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    // On a 120 Hz display every frame would double the work for no visible gain
    if (now - last < MIN_FRAME_MS) return;
    // Time only advances while the scene is on screen, so it resumes where it paused
    // The first rAF timestamp can predate `last`, so clamp at zero
    const gap = now - last;
    const delta = Math.min(Math.max(gap / 1000, 0), 0.05);
    last = now;
    if (!visible || document.hidden) return;
    if (adaptive) tune(gap);
    elapsed += delta;
    pointer.lerp(pointerTarget, 0.05);
    update(elapsed, delta);
    renderer.render(scene, camera);
  };
  if (reduced) {
    update(1.5, 0);
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onPointer);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((m) => {
        (m as THREE.MeshBasicMaterial).map?.dispose();
        m.dispose();
      });
    });
    envTarget?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

export const CHROME = () =>
  new THREE.MeshStandardMaterial({ color: 0xdfe3ee, metalness: 1, roughness: 0.14, envMapIntensity: 1.5 });

export const BLOOD = 0xe11d48;
