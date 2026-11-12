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
  /** Adds a studio environment map so metal surfaces have something to reflect. */
  reflections?: boolean;
  setup: (stage: Stage) => (time: number, delta: number) => void;
}

/**
 * Mounts a WebGL scene into `container` and returns a cleanup function.
 * Handles resize, pauses when hidden or off-screen, renders a single still
 * frame under prefers-reduced-motion, and disposes every GPU resource.
 */
export function mountStage(container: HTMLElement, { fov = 40, reflections = false, setup }: StageOptions): () => void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return () => {}; // No WebGL: the page works without the scene
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
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

  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    // Time only advances while the scene is on screen, so it resumes where it paused
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || document.hidden) return;
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
      materials.forEach((m) => m.dispose());
    });
    envTarget?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

export const CHROME = () =>
  new THREE.MeshStandardMaterial({ color: 0xdfe3ee, metalness: 1, roughness: 0.14, envMapIntensity: 1.5 });

export const BLOOD = 0xe11d48;
