import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BLOOD, CHROME, type Stage } from "./stage";
import { createCrown, createFootball, createPitchLines, createThornRing } from "./models";

/**
 * A gothic cathedral stadium on a rainy night, seen from a circling blimp:
 * a stone bowl with a lancet arcade and flying buttresses, a nave and great
 * tower grown out of one stand, a low-resolution city with neon corners, a
 * crowd of point sprites, and a match played as 28-second passages: home
 * goals (with fire from the spires), an away goal, and a save.
 */

const HALF_LENGTH = 52.5;
const HALF_WIDTH = 34;
const ROWS = 26;
const ROW_DEPTH = 1.7;
const ROW_RISE = 1.25;
const STAND_START = 9;
const WALL_OFFSET = STAND_START + ROWS * ROW_DEPTH + 1.5;
const WALL_HEIGHT = 42;
/** Rows left empty for the walkway that splits the lower and upper tiers. */
const TIER_GAP = [11.2, 13.4] as const;
const CANOPY_REACH = 12;
const CANOPY_RISE = 9;
const SHAPE_N = 3; // superellipse exponent: between an ellipse (2) and a rectangle (∞)

type XZ = [number, number];

const sgnPow = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;

/** Point on the bowl outline `offset` metres out from the pitch edge. */
function ring(theta: number, offset: number, y = 0) {
  const e = 2 / SHAPE_N;
  return new THREE.Vector3(sgnPow(Math.cos(theta), e) * (HALF_LENGTH + offset), y, sgnPow(Math.sin(theta), e) * (HALF_WIDTH + offset));
}

/** Angles that step evenly along the outline's arc length (equal theta steps bunch up on the straights). */
function evenThetas(count: number, offset: number): number[] {
  const samples = 2048;
  const cumulative = [0];
  let prev = ring(0, offset);
  for (let i = 1; i <= samples; i++) {
    const p = ring((i / samples) * Math.PI * 2, offset);
    cumulative.push(cumulative[i - 1] + p.distanceTo(prev));
    prev = p;
  }
  const total = cumulative[samples];
  const out: number[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total;
    while (cumulative[j + 1] < target) j++;
    const span = cumulative[j + 1] - cumulative[j] || 1;
    out.push(((j + (target - cumulative[j]) / span) / samples) * Math.PI * 2);
  }
  return out;
}

function outwardNormal(theta: number, offset: number) {
  const p = ring(theta, offset);
  const a = HALF_LENGTH + offset;
  const b = HALF_WIDTH + offset;
  return new THREE.Vector3(sgnPow(p.x / a, SHAPE_N - 1) / a, 0, sgnPow(p.z / b, SHAPE_N - 1) / b).normalize();
}

/* ---------- Architecture ---------- */

/** Flat gothic cross with flared, pointed arms; the foot of the stem sits at the origin. */
function crossGeometry(size: number) {
  const arm = (len: number): [number, number][] => [
    [-0.09, 0.09], [-0.07, len * 0.55], [-0.2, len * 0.82], [0, len], [0.2, len * 0.82], [0.07, len * 0.55], [0.09, 0.09],
  ];
  const turn = ([x, y]: [number, number], quarter: number): [number, number] =>
    quarter === 0 ? [x, y] : quarter === 1 ? [y, -x] : quarter === 2 ? [-x, -y] : [-y, x];
  // Up, right, down (the long stem), left
  const outline = [0.75, 0.55, 1.15, 0.55].flatMap((len, quarter) => arm(len).map((pt) => turn(pt, quarter)));
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x * size, y * size)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.14 * size, bevelEnabled: false });
  geometry.translate(0, 1.15 * size, -0.07 * size);
  return geometry;
}

function roseWindow(radius: number, glow: THREE.Material, chrome: THREE.Material, petals = 12) {
  const rose = new THREE.Group();
  rose.add(new THREE.Mesh(new THREE.CircleGeometry(radius, 40), glow));
  rose.add(new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.07, 6, 48), chrome));
  rose.add(new THREE.Mesh(new THREE.TorusGeometry(radius * 0.36, radius * 0.045, 6, 32), chrome));
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.64, radius * 0.045, radius * 0.06), chrome);
    spoke.position.set(Math.cos(angle) * radius * 0.68, Math.sin(angle) * radius * 0.68, 0);
    spoke.rotation.z = angle;
    // A small circle between each pair of spokes makes the petal ring
    const petal = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.13, radius * 0.03, 5, 16), chrome);
    const mid = angle + Math.PI / petals;
    petal.position.set(Math.cos(mid) * radius * 0.8, Math.sin(mid) * radius * 0.8, 0);
    rose.add(spoke, petal);
  }
  return rose;
}

function lancet(width: number, height: number) {
  const spring = height * 0.58;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, spring);
  shape.quadraticCurveTo(width / 2, height * 0.88, 0, height);
  shape.quadraticCurveTo(-width / 2, height * 0.88, -width / 2, spring);
  shape.closePath();
  return shape;
}

/* ---------- Materials ---------- */

/** Weathered ashlar: courses of grey blocks with dark mortar and rain streaks, drawn once on a canvas. */
function makeStoneTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0e0f11";
  ctx.fillRect(0, 0, size, size);
  const course = 32;
  for (let row = 0; row < size / course; row++) {
    let x = row % 2 ? -24 : 0;
    while (x < size) {
      const w = 36 + Math.random() * 34;
      const v = 34 + Math.random() * 20;
      // Slight green and brown casts, like lichen and soot
      ctx.fillStyle = `rgb(${v + Math.random() * 8}, ${v + Math.random() * 10}, ${v - 2 + Math.random() * 6})`;
      ctx.fillRect(x + 1.5, row * course + 1.5, w - 3, course - 3);
      x += w;
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const streak = ctx.createLinearGradient(0, 0, 0, size);
    streak.addColorStop(0, "rgba(0,0,0,0.45)");
    streak.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = streak;
    ctx.fillRect(x, 0, 2 + Math.random() * 6, size * (0.3 + Math.random() * 0.7));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.5, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

const NEON_RED = 0xff1232;

/** A flat pane whose UVs run 0-1 across its own bounds, so the glass shader can centre its glow on any window. */
function glassPane(shape: THREE.Shape, segments: number) {
  const geometry = new THREE.ShapeGeometry(shape, segments);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) - min.x) / (max.x - min.x), (position.getY(i) - min.y) / (max.y - min.y));
  }
  return geometry;
}

interface TraceryOptions {
  /** Vertical lights the window is divided into. */
  lights?: number;
  /** Horizontal bars across the lights. */
  transoms?: number;
  /** Belfry slats between the top transom and the springing of the arch. */
  louvres?: number;
  /** A second, outer moulding over the arch. */
  hood?: boolean;
}

/** The outline of a lancet() arch, from its right foot over the apex to its left foot. */
function archPoints(width: number, height: number, segments = 10): THREE.Vector2[] {
  const spring = height * 0.58;
  const half = width / 2;
  const pts = [new THREE.Vector2(half, 0), new THREE.Vector2(half, spring)];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    pts.push(new THREE.Vector2(half * (1 - t * t), (1 - t) ** 2 * spring + 2 * (1 - t) * t * height * 0.88 + t * t * height));
  }
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    pts.push(new THREE.Vector2(-half * (2 * t - t * t), (1 - t) ** 2 * height + 2 * (1 - t) * t * height * 0.88 + t * t * spring));
  }
  pts.push(new THREE.Vector2(-half, 0));
  return pts;
}

/** Half the clear width of a lancet() arch at height `y` (above the springing it narrows to the apex). */
function archHalfWidth(width: number, height: number, y: number) {
  const spring = height * 0.58;
  if (y <= spring) return width / 2;
  if (y >= height) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2;
    const at = (1 - t) ** 2 * spring + 2 * (1 - t) * t * height * 0.88 + t * t * height;
    if (at < y) lo = t; else hi = t;
  }
  return (width / 2) * (1 - lo * lo);
}

/**
 * Ironwork for a pointed window, merged into one geometry: a moulded frame and
 * sill, mullions dividing it into lights, a pointed head over each light, and
 * in the arch a cusped oculus with a smaller one above it. Transoms, belfry
 * louvres and an outer hood moulding are optional.
 */
function traceryGeometry(width: number, height: number, { lights = 2, transoms = 0, louvres = 0, hood = false }: TraceryOptions = {}) {
  const bar = Math.max(0.14, width * 0.05);
  const depth = bar * 1.5;
  const spring = height * 0.58;
  const parts: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, x: number, y: number, turn = 0, thickness = depth) => {
    const g = new THREE.BoxGeometry(w, h, thickness);
    if (turn) g.rotateZ(turn);
    parts.push(g.translate(x, y, 0).toNonIndexed());
  };
  const ringAt = (radius: number, x: number, y: number, tube = bar * 0.45) =>
    parts.push(new THREE.TorusGeometry(radius, tube, 4, 16).translate(x, y, 0).toNonIndexed());
  const archBand = (outerW: number, outerH: number, innerW: number, innerH: number, thickness: number) => {
    const outline = [...archPoints(outerW, outerH), ...archPoints(innerW, innerH).reverse()];
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline), { depth: thickness, bevelEnabled: false }).translate(0, 0, -thickness / 2);
    parts.push(g.index ? g.toNonIndexed() : g);
  };

  archBand(width + bar * 1.5, height + bar * 0.9, width - bar * 0.5, height - bar * 0.3, depth);
  if (hood) archBand(width + bar * 4.6, height + bar * 2.6, width + bar * 3.2, height + bar * 1.9, depth * 0.7);
  box(width + bar * (hood ? 5.4 : 2.6), bar * 1.3, 0, -bar * 0.65, 0, depth * 1.6); // sill

  // Mullions, and a pointed head springing over each light
  const clear = width - bar * 0.5;
  const light = clear / lights;
  const rise = light * 0.8;
  for (let i = 1; i < lights; i++) box(bar * 0.8, spring, -clear / 2 + i * light, spring / 2);
  if (lights > 1) {
    const length = Math.hypot(light / 2, rise);
    const angle = Math.atan2(rise, light / 2);
    for (let i = 0; i < lights; i++) {
      const left = -clear / 2 + i * light;
      box(length, bar * 0.7, left + light / 4, spring + rise / 2, angle);
      box(length, bar * 0.7, left + (light * 3) / 4, spring + rise / 2, -angle);
    }
  }

  // The arch above the lights: a large oculus, cusped into a quatrefoil when there is room, and a small one over it
  const headBase = spring + (lights > 1 ? rise : 0);
  const room = height - headBase;
  const centre = headBase + room * 0.42;
  const radius = Math.min(archHalfWidth(width, height, centre) - bar * 1.3, room * 0.36, centre - headBase - bar * 0.3);
  if (radius > bar * 1.5) {
    ringAt(radius, 0, centre);
    if (radius > bar * 3.6) {
      for (let c = 0; c < 4; c++) {
        const a = Math.PI / 4 + (c * Math.PI) / 2;
        ringAt(radius * 0.4, Math.cos(a) * radius * 0.5, centre + Math.sin(a) * radius * 0.5, bar * 0.3);
      }
    }
    const above = height - (centre + radius);
    const upper = centre + radius + above * 0.42;
    const small = Math.min(archHalfWidth(width, height, upper) - bar, above * 0.3);
    if (small > bar * 1.1) ringAt(small, 0, upper, bar * 0.35);
  }

  for (let t = 1; t <= transoms; t++) box(clear, bar * 0.8, 0, (spring * t) / (transoms + 1));
  const louvreFrom = transoms ? (spring * transoms) / (transoms + 1) : 0;
  for (let l = 1; l <= louvres; l++) box(clear, bar * 0.35, 0, louvreFrom + ((spring - louvreFrom) * l) / (louvres + 1), 0, depth * 0.6);

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("Tracery parts could not be merged");
  return merged;
}

/** A glass pane with its ironwork in front, facing +z with the sill at the origin. Geometries are shared per size. */
function traceriedWindow(kit: Kit, width: number, height: number, options: TraceryOptions = {}) {
  const key = `${width}x${height}:${JSON.stringify(options)}`;
  let shared = kit.windows.get(key);
  if (!shared) {
    shared = { pane: glassPane(lancet(width, height), 10), iron: traceryGeometry(width, height, options) };
    kit.windows.set(key, shared);
  }
  const window = new THREE.Group();
  const iron = new THREE.Mesh(shared.iron, kit.iron);
  iron.position.z = Math.max(0.14, width * 0.05) * 0.75 + 0.06; // half the ironwork's depth, plus clearance from the glass
  window.add(new THREE.Mesh(shared.pane, kit.glass), iron);
  return window;
}

interface Kit {
  /** Stone with the block texture tiled `u` by `v` times across each face. */
  stone: (u: number, v: number, tint?: number) => THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  /** Smoked black glass with a red glow burning behind it. `uGlow` sets how hot. */
  glass: THREE.ShaderMaterial;
  /** Red neon tubing. */
  neon: THREE.MeshBasicMaterial;
  /** Black ironwork for window and door surrounds. */
  iron: THREE.MeshStandardMaterial;
  /** Window geometries already built, by size and tracery pattern. */
  windows: Map<string, { pane: THREE.BufferGeometry; iron: THREE.BufferGeometry }>;
  glow: THREE.CanvasTexture;
}

function makeKit(): Kit {
  const base = makeStoneTexture();
  return {
    stone: (u, v, tint = 0xffffff) => {
      const map = base.clone();
      map.repeat.set(u, v);
      map.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.92, metalness: 0.04, envMapIntensity: 0.18 });
    },
    slate: new THREE.MeshStandardMaterial({ color: 0x191c23, roughness: 0.78, metalness: 0.1, envMapIntensity: 0.25 }),
    chrome: CHROME(),
    glass: new THREE.ShaderMaterial({
      uniforms: { uGlow: { value: 0.8 } },
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 p = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            p = instanceMatrix * p;
          #endif
          gl_Position = projectionMatrix * modelViewMatrix * p;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uGlow;
        varying vec2 vUv;
        void main() {
          // A solid, bright neon-red light filling the window, with a rim of black glass around it
          float sides = smoothstep(0.5, 0.34, abs(vUv.x - 0.5));
          float ends = smoothstep(0.0, 0.07, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
          float core = sides * ends;
          vec3 neon = vec3(1.0, 0.07, 0.2) * (0.6 + 0.4 * uGlow);
          gl_FragColor = vec4(mix(vec3(0.012, 0.0, 0.004), neon, core), 0.86 + 0.14 * core);
        }`,
    }),
    neon: new THREE.MeshBasicMaterial({ color: NEON_RED, fog: false }),
    iron: new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.55, metalness: 0.5, envMapIntensity: 0.25 }),
    windows: new Map(),
    glow: makeGlowTexture(),
  };
}

function glowSprite(kit: Kit, color: number, size: number, opacity = 0.6) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sprite.scale.setScalar(size);
  return sprite;
}

/* ---------- Stadium shell ---------- */

/** A strip of quads between two closed rings, e.g. a wall or a roof canopy. */
function ringStrip(inner: (theta: number) => THREE.Vector3, outer: (theta: number) => THREE.Vector3, uRepeat: number, segments = 180) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let s = 0; s <= segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const a = inner(theta);
    const b = outer(theta);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    uvs.push((s / segments) * uRepeat, 0, (s / segments) * uRepeat, 1);
    if (s < segments) index.push(s * 2, s * 2 + 1, s * 2 + 2, s * 2 + 2, s * 2 + 1, s * 2 + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function buildBowl(group: THREE.Group, kit: Kit) {
  const segments = 180;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= ROWS; r++) {
    for (let s = 0; s <= segments; s++) {
      const p = ring((s / segments) * Math.PI * 2, STAND_START + r * ROW_DEPTH, 0.6 + r * ROW_RISE);
      positions.push(p.x, p.y, p.z);
    }
  }
  const stride = segments + 1;
  for (let r = 0; r < ROWS; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * stride + s;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const stand = new THREE.BufferGeometry();
  stand.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  stand.setIndex(indices);
  stand.computeVertexNormals();
  group.add(new THREE.Mesh(stand, new THREE.MeshStandardMaterial({ color: 0x16090d, roughness: 0.9, side: THREE.DoubleSide })));

  // Outer wall in stone, and a dark glazed canopy over the back rows
  const wall = ringStrip((t) => ring(t, WALL_OFFSET, 0), (t) => ring(t, WALL_OFFSET, WALL_HEIGHT), 46);
  const wallMaterial = kit.stone(1, 3.5);
  wallMaterial.side = THREE.DoubleSide;
  group.add(new THREE.Mesh(wall, wallMaterial));

  const canopy = ringStrip((t) => ring(t, WALL_OFFSET - CANOPY_REACH, WALL_HEIGHT + CANOPY_RISE), (t) => ring(t, WALL_OFFSET, WALL_HEIGHT + 0.6), 1);
  group.add(new THREE.Mesh(canopy, new THREE.MeshStandardMaterial({ color: 0x0c0e13, transparent: true, opacity: 0.58, metalness: 0.85, roughness: 0.22, side: THREE.DoubleSide, depthWrite: false })));

  const concourse = STAND_START + TIER_GAP[0] * ROW_DEPTH;
  // Pitch-side and concourse rails stay chrome; the trim along the top of the stadium is red neon
  const rails: [number, number, number, THREE.Material][] = [
    [WALL_OFFSET, WALL_HEIGHT, 0.5, kit.neon],
    [WALL_OFFSET - CANOPY_REACH, WALL_HEIGHT + CANOPY_RISE, 0.35, kit.neon],
    [STAND_START - 0.6, 1.2, 0.18, kit.chrome],
    [concourse, 1.4 + TIER_GAP[0] * ROW_RISE, 0.22, kit.chrome],
  ];
  for (const [offset, y, radius, material] of rails) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 120 }, (_, i) => ring((i / 120) * Math.PI * 2, offset, y)), true);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 360, radius, 6, true), material));
  }
}

function buildArcade(group: THREE.Group, kit: Kit) {
  const bays = 76;
  const thetas = evenThetas(bays, WALL_OFFSET);
  const paneGeometry = glassPane(lancet(4.8, 21), 10);
  const frameGeometry = traceryGeometry(4.8, 21, { lights: 2, hood: true });

  const pierStone = kit.stone(0.4, 5);
  const frames = new THREE.InstancedMesh(frameGeometry, kit.iron, bays * 2);
  const panes = new THREE.InstancedMesh(paneGeometry, kit.glass, bays * 2);
  const piers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, WALL_HEIGHT + 4, 3), pierStone, bays);
  const pinnacles = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 11, 4), kit.slate, bays);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const tiltQ = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  /** Matrix for something on the wall at `theta`: `out` metres outside it, facing outward, optionally tilted. */
  const place = (theta: number, out: number, y: number, scale: number, tilt = 0) => {
    const n = outwardNormal(theta, WALL_OFFSET);
    q.setFromAxisAngle(up, Math.atan2(n.x, n.z));
    if (tilt) q.multiply(tiltQ.setFromAxisAngle(xAxis, tilt));
    return m.compose(ring(theta, WALL_OFFSET, y).addScaledVector(n, out), q, new THREE.Vector3(scale, scale, scale));
  };

  // Flying buttresses: a free-standing pier outside the wall, tied back to it by a sloping flyer
  const FLY_OUT = 12;
  const outerPiers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 30, 2.6), kit.stone(0.4, 3.5), bays);
  const outerPinnacles = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 9, 4), kit.slate, bays);
  const flyerRun = FLY_OUT - 1.4;
  const flyerRise = 11;
  const flyers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 1.1, Math.hypot(flyerRun, flyerRise)), pierStone, bays);
  const crosses = new THREE.InstancedMesh(crossGeometry(3.2), kit.chrome, bays / 2);

  // Ribs carrying the canopy
  const ribCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, CANOPY_RISE + 1, -2), new THREE.Vector3(0, CANOPY_RISE, -CANOPY_REACH));
  const ribs = new THREE.InstancedMesh(new THREE.TubeGeometry(ribCurve, 12, 0.24, 5), kit.neon, bays);

  const step = (Math.PI * 2) / bays;
  thetas.forEach((theta, i) => {
    // Tall clerestory window above a smaller arcade arch
    frames.setMatrixAt(i * 2, place(theta, 0.56, 16.4, 1));
    panes.setMatrixAt(i * 2, place(theta, 0.3, 16.4, 1));
    frames.setMatrixAt(i * 2 + 1, place(theta, 0.45, 1.2, 0.55));
    panes.setMatrixAt(i * 2 + 1, place(theta, 0.3, 1.2, 0.55));
    const between = theta + step / 2;
    piers.setMatrixAt(i, place(between, 1.4, (WALL_HEIGHT + 4) / 2, 1));
    pinnacles.setMatrixAt(i, place(between, 1.4, WALL_HEIGHT + 9.5, 1));

    outerPiers.setMatrixAt(i, place(between, FLY_OUT, 15, 1));
    outerPinnacles.setMatrixAt(i, place(between, FLY_OUT, 34.5, 1));
    flyers.setMatrixAt(i, place(between, 1.4 + flyerRun / 2, 27 + flyerRise / 2, 1, Math.atan2(flyerRise, flyerRun)));
    if (i % 2 === 0) crosses.setMatrixAt(i / 2, place(between, FLY_OUT, 38.6, 1));
    ribs.setMatrixAt(i, place(between, 0, WALL_HEIGHT, 1));
  });
  group.add(frames, panes, piers, pinnacles, outerPiers, outerPinnacles, flyers, crosses, ribs);
}

/** Horizontal spikes jutting from the four corners of a square tower, like gargoyle spouts. */
function addGargoyles(tower: THREE.Group, width: number, y: number, material: THREE.Material) {
  for (let corner = 0; corner < 4; corner++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(width * 0.06, width * 0.55, 4), material);
    const angle = Math.PI / 4 + (corner * Math.PI) / 2;
    spike.position.set(Math.cos(angle) * width * 0.9, y, Math.sin(angle) * width * 0.9);
    spike.rotation.set(0, -angle, -Math.PI / 2);
    tower.add(spike);
  }
}

/** Returns the tip of every spire, where the fire comes out. */
function buildTowers(group: THREE.Group, kit: Kit): THREE.Vector3[] {
  const tips: THREE.Vector3[] = [];
  evenThetas(8, WALL_OFFSET).forEach((theta0, i) => {
    const theta = theta0 + Math.PI / 8;
    const tall = i % 2 === 0;
    const height = tall ? 74 : 54;
    const width = tall ? 11 : 8.5;
    const n = outwardNormal(theta, WALL_OFFSET);
    const tower = new THREE.Group();
    tower.position.copy(ring(theta, WALL_OFFSET).addScaledVector(n, width * 0.55));
    tower.rotation.y = Math.atan2(n.x, n.z);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), kit.stone(1, height / 11));
    shaft.position.y = height / 2;
    const spireHeight = height * SPIRE_RATIO;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, spireHeight, 8), kit.slate);
    spire.position.y = height + spireHeight / 2;
    spire.rotation.y = Math.PI / 8;
    const cross = new THREE.Mesh(crossGeometry(width * 0.75), kit.chrome);
    cross.position.y = height + spireHeight - 1;
    tower.add(shaft, spire, cross);

    for (const level of [0.3, 0.62, 1]) {
      const belt = new THREE.Mesh(new THREE.BoxGeometry(width + 1.2, 1.1, width + 1.2), kit.slate);
      belt.position.y = height * level;
      tower.add(belt);
    }
    addGargoyles(tower, width, height * 0.97, kit.slate);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(width * 0.14, height * 0.26, 4), kit.slate);
      pinnacle.position.set((dx * width) / 2, height + height * 0.13, (dz * width) / 2);
      tower.add(pinnacle);
    }
    for (const face of [0, 1, 2, 3]) {
      const slit = traceriedWindow(kit, width * 0.22, height * 0.2, { lights: 1, transoms: 2 });
      slit.position.y = height * 0.72;
      slit.rotation.y = (face * Math.PI) / 2;
      slit.translateZ(width / 2 + 0.05);
      tower.add(slit);
    }
    tips.push(tower.position.clone().setY(height + spireHeight + 2));
    if (tall) {
      const rose = roseWindow(width * 0.32, kit.glass, kit.iron, 8);
      rose.position.set(0, height * 0.48, width / 2 + 0.2);
      tower.add(rose);
    }
    group.add(tower);
  });
  return tips;
}

/** A gabled front facing +z: great rose window over a glowing door, twin turrets, a cross on the gable. */
function makePortal(kit: Kit) {
  const portal = new THREE.Group();
  const gable = new THREE.Shape();
  gable.moveTo(-17, 0); gable.lineTo(17, 0); gable.lineTo(17, 46); gable.lineTo(0, 70); gable.lineTo(-17, 46); gable.closePath();
  portal.add(new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 4, bevelEnabled: false }), kit.stone(0.045, 0.045)));
  for (const side of [-1, 1]) {
    const rake = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(17, 24) + 1, 0.9, 4.8), kit.slate);
    rake.position.set(side * 8.5, 58, 2);
    rake.rotation.z = -side * Math.atan2(24, 17);
    portal.add(rake);
  }
  const rose = roseWindow(8.5, kit.glass, kit.iron, 12);
  rose.position.set(0, 40, 4.15);
  portal.add(rose);

  const doorFrame = lancet(11, 24);
  doorFrame.holes.push(new THREE.Path(lancet(8.6, 22).getPoints(12)));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(doorFrame, { depth: 1.2, bevelEnabled: false, curveSegments: 10 }), kit.iron);
  frame.position.z = 4;
  const door = traceriedWindow(kit, 8.8, 22.4, { lights: 2, transoms: 1 });
  door.position.set(0, 0.2, 4.1);
  portal.add(door, frame);

  for (const side of [-1, 1]) {
    const niche = traceriedWindow(kit, 3, 12, { lights: 1, transoms: 1 });
    niche.position.set(side * 11.5, 6, 4.1);
    const turret = new THREE.Mesh(new THREE.BoxGeometry(5, 60, 5), kit.stone(0.5, 5.5));
    turret.position.set(side * 19.5, 30, 2);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.9, 22, 8), kit.slate);
    cap.position.set(side * 19.5, 71, 2);
    const finial = new THREE.Mesh(crossGeometry(3.4), kit.chrome);
    finial.position.set(side * 19.5, 81, 2);
    portal.add(niche, turret, cap, finial);
  }
  const cross = new THREE.Mesh(crossGeometry(8), kit.chrome);
  cross.position.set(0, 69, 2);
  portal.add(cross);
  return portal;
}

/** Spire height as a share of the tower beneath it. */
const SPIRE_RATIO = 0.42;
/**
 * A crown steeple on the great tower: four flying ribs spring from the corner
 * turrets and meet in a collar high above the roof. The chrome football from
 * the landing page hangs in the cage they make, turning inside two thorn
 * rings on a shaft of red light, and its crown is set on the apex.
 */
function buildCrownSteeple(tower: THREE.Group, kit: Kit, width: number) {
  const roof = GREAT_TOWER_HEIGHT;
  const half = width / 2;
  const apex = roof + 30;
  const heart = roof + 15;

  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(dx * half, roof + 5, dz * half),
      new THREE.Vector3(dx * half * 0.8, roof + 26, dz * half * 0.8),
      new THREE.Vector3(dx * 2.4, apex, dz * 2.4),
    );
    const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.85, 4), kit.slate);
    // A line of neon rides along the top of each rib
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.2, 5), kit.neon);
    tube.position.y = 0.95;
    tower.add(rib, tube);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.7, 6, 24), kit.iron);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = apex;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.6, 1.4, 8), kit.slate);
  plinth.position.y = roof + 0.7;

  const crown = createCrown(4);
  crown.position.y = apex + 1.7;

  const ball = createFootball(5.8);
  ball.position.y = heart;
  const rings = [createThornRing(7.4, 26), createThornRing(8.4, 30)];
  rings[0].rotation.x = Math.PI / 2.4;
  rings[1].rotation.set(Math.PI / 3, Math.PI / 5, 0);
  rings.forEach((ring) => ring.position.y = heart);

  // The ball floats on a shaft of red light rising from the plinth
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 3.4, heart - roof - 6, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: BLOOD, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
  );
  shaft.position.y = roof + 1.4 + (heart - roof - 6) / 2;
  const aura = glowSprite(kit, BLOOD, 44, 0.4);
  aura.position.y = heart;
  tower.add(collar, plinth, crown, ball, ...rings, shaft, aura);

  let last = 0;
  let spin = 0;
  /** `joy` (0-1) is the home crowd's excitement: the ball spins up and its aura swells on a goal. */
  return (time: number, joy: number) => {
    spin += Math.max(0, time - last) * (0.4 + joy * 2.6);
    last = time;
    ball.rotation.set(Math.sin(time * 0.3) * 0.25, spin, 0);
    ball.position.y = heart + Math.sin(time * 0.9) * 0.5;
    rings[0].rotation.z = spin * 0.6;
    rings[1].rotation.z = -spin * 0.45;
    crown.rotation.y = -time * 0.3;
    (aura.material as THREE.SpriteMaterial).opacity = 0.32 + joy * 0.45;
  };
}

const NAVE_LENGTH = 58;
const GREAT_TOWER_HEIGHT = 112;

/**
 * The cathedral proper, grown out of the north stand: a nave with aisles and a
 * slate roof, a west front, and one great square tower crowned with pinnacles.
 */
function buildCathedral(group: THREE.Group, kit: Kit) {
  const theta = Math.PI / 2;
  const n = outwardNormal(theta, WALL_OFFSET);
  const cathedral = new THREE.Group();
  cathedral.position.copy(ring(theta, WALL_OFFSET));
  cathedral.rotation.y = Math.atan2(n.x, n.z);

  const naveWidth = 40;
  const naveHeight = 52;
  const nave = new THREE.Mesh(new THREE.BoxGeometry(naveWidth, naveHeight, NAVE_LENGTH), kit.stone(3.5, 4.5));
  nave.position.set(0, naveHeight / 2, NAVE_LENGTH / 2);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-naveWidth / 2 - 1.5, 0); roofShape.lineTo(naveWidth / 2 + 1.5, 0); roofShape.lineTo(0, 22); roofShape.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: NAVE_LENGTH, bevelEnabled: false }), kit.slate);
  roof.position.y = naveHeight;
  cathedral.add(nave, roof);

  const aisleStone = kit.stone(5, 2.5);
  const buttressStone = kit.stone(0.3, 3.5);
  for (const side of [-1, 1]) {
    const aisle = new THREE.Mesh(new THREE.BoxGeometry(13, 28, NAVE_LENGTH), aisleStone);
    aisle.position.set(side * (naveWidth / 2 + 6.5), 14, NAVE_LENGTH / 2);
    // Lean-to roof from the aisle wall up to the nave
    const leanTo = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.8, NAVE_LENGTH), kit.slate);
    leanTo.position.set(side * (naveWidth / 2 + 6.5), 31.5, NAVE_LENGTH / 2);
    leanTo.rotation.z = -side * 0.42;
    cathedral.add(aisle, leanTo);

    for (let z = 5; z < NAVE_LENGTH; z += 9.5) {
      const x = side * (naveWidth / 2 + 13.1);
      const aisleWindow = traceriedWindow(kit, 4.6, 18, { lights: 2, hood: true });
      aisleWindow.position.set(x, 5, z);
      aisleWindow.rotation.y = (side * Math.PI) / 2;
      const clerestory = traceriedWindow(kit, 3.6, 12, { lights: 2 });
      clerestory.position.set(side * (naveWidth / 2 + 0.1), 37, z);
      clerestory.rotation.y = (side * Math.PI) / 2;
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(3.4, 34, 1.8), buttressStone);
      buttress.position.set(x + side * 1.4, 17, z + 4.75);
      const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 4), kit.slate);
      pinnacle.position.set(x + side * 1.4, 38.5, z + 4.75);
      // A flyer from each buttress up to the nave wall
      const flyer = new THREE.Mesh(new THREE.BoxGeometry(15, 0.9, 0.9), buttressStone);
      flyer.position.set(side * (naveWidth / 2 + 7), 40, z + 4.75);
      flyer.rotation.z = -side * 0.5;
      cathedral.add(aisleWindow, clerestory, buttress, pinnacle, flyer);
    }
  }

  const front = makePortal(kit);
  front.position.z = NAVE_LENGTH;
  cathedral.add(front);

  // The great tower stands where the nave meets the stand
  const width = 28;
  const tower = new THREE.Group();
  tower.position.z = width / 2 + 1;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(width, GREAT_TOWER_HEIGHT, width), kit.stone(2.6, 12));
  shaft.position.y = GREAT_TOWER_HEIGHT / 2;
  tower.add(shaft);
  for (const level of [0.42, 0.62, 0.945, 1]) {
    const course = new THREE.Mesh(new THREE.BoxGeometry(width + 1.6, 1.4, width + 1.6), kit.slate);
    course.position.y = GREAT_TOWER_HEIGHT * level;
    tower.add(course);
  }
  const turretStone = kit.stone(1, 13);
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, GREAT_TOWER_HEIGHT + 6, 8), turretStone);
    turret.position.set((dx * width) / 2, (GREAT_TOWER_HEIGHT + 6) / 2, (dz * width) / 2);
    const spirelet = new THREE.Mesh(new THREE.ConeGeometry(3.2, 17, 8), kit.slate);
    spirelet.position.set((dx * width) / 2, GREAT_TOWER_HEIGHT + 14.5, (dz * width) / 2);
    const finial = new THREE.Mesh(crossGeometry(4.5), kit.chrome);
    finial.position.set((dx * width) / 2, GREAT_TOWER_HEIGHT + 22, (dz * width) / 2);
    tower.add(turret, spirelet, finial);
  }
  for (let face = 0; face < 4; face++) {
    const side = new THREE.Group();
    side.rotation.y = (face * Math.PI) / 2;
    // A pair of three-light belfry windows with louvres, a pair of two-light windows below,
    // and small pinnacles along the parapet
    for (const x of [-6.6, 6.6]) {
      // Heights are fractions of the tower so the windows always sit between its string courses
      const belfry = traceriedWindow(kit, 7.2, GREAT_TOWER_HEIGHT * 0.27, { lights: 3, transoms: 1, louvres: 9, hood: true });
      belfry.position.set(x, GREAT_TOWER_HEIGHT * 0.645, width / 2 + 0.1);
      const lower = traceriedWindow(kit, 5.2, GREAT_TOWER_HEIGHT * 0.155, { lights: 2, transoms: 1, hood: true });
      lower.position.set(x, GREAT_TOWER_HEIGHT * 0.44, width / 2 + 0.1);
      side.add(belfry, lower);
    }
    for (const x of [-8, 0, 8]) {
      const merlon = new THREE.Mesh(new THREE.ConeGeometry(1.3, 13, 4), kit.slate);
      merlon.position.set(x, GREAT_TOWER_HEIGHT + 6.5, width / 2);
      side.add(merlon);
    }
    tower.add(side);
  }
  addGargoyles(tower, width, GREAT_TOWER_HEIGHT * 0.62, kit.slate);
  addGargoyles(tower, width, GREAT_TOWER_HEIGHT * 0.945, kit.slate);
  const turnRelic = buildCrownSteeple(tower, kit, width);
  cathedral.add(tower);
  group.add(cathedral);

  // World positions of the four corner spirelets on the great tower
  cathedral.updateMatrixWorld(true);
  const tips = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dz]) =>
    tower.localToWorld(new THREE.Vector3((dx * width) / 2, GREAT_TOWER_HEIGHT + 24, (dz * width) / 2)));
  return { tips, turnRelic };
}

function buildPortals(group: THREE.Group, kit: Kit) {
  // The fourth axis is taken by the cathedral
  for (const theta of [0, Math.PI, (3 * Math.PI) / 2]) {
    const n = outwardNormal(theta, WALL_OFFSET);
    const portal = makePortal(kit);
    portal.position.copy(ring(theta, WALL_OFFSET).addScaledVector(n, 13));
    portal.rotation.y = Math.atan2(n.x, n.z);
    group.add(portal);
  }
}

/** Four floodlight masts on the wall head, each with a hot white head, a halo and a shaft of light. */
function buildFloodlights(group: THREE.Group, kit: Kit) {
  const beam = new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const head = new THREE.MeshBasicMaterial({ color: 0xf2f7ff, fog: false });
  const steel = new THREE.MeshStandardMaterial({ color: 0x23262d, metalness: 0.8, roughness: 0.4 });
  const upAxis = new THREE.Vector3(0, 1, 0);
  // Halfway between each corner tower and its neighbour, where nothing else stands
  const thetas = evenThetas(16, WALL_OFFSET);
  for (const k of [2, 6, 10, 14]) {
    const theta = thetas[k];
    const n = outwardNormal(theta, WALL_OFFSET);
    // The mast rises from the canopy's inner ring, just inside the wall
    const foot = ring(theta, WALL_OFFSET, WALL_HEIGHT + CANOPY_RISE).addScaledVector(n, -CANOPY_REACH);
    const mastHeight = 13;
    const top = foot.clone().setY(foot.y + mastHeight);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.1, mastHeight, 1.1), steel);
    mast.position.copy(foot).setY(foot.y + mastHeight / 2);

    const target = new THREE.Vector3(Math.sign(foot.x) * 18, 0, Math.sign(foot.z) * 11);
    // A dark housing with the lit face on the pitch side only, so from behind it is just a silhouette
    const panel = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 0.8), steel);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 4.7), head);
    face.position.z = 0.45;
    panel.add(face);
    panel.position.copy(top);
    panel.lookAt(target); // the lamp face points straight at its patch of pitch
    const lamp = top.clone().addScaledVector(target.clone().sub(top).normalize(), 1.2);
    const halo = glowSprite(kit, 0xd5e4ff, 54, 0.7);
    halo.position.copy(lamp);

    const span = target.clone().sub(lamp);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2, 26, span.length(), 20, 1, true), beam);
    shaft.position.copy(lamp).addScaledVector(span, 0.5);
    shaft.quaternion.setFromUnitVectors(upAxis, span.clone().negate().normalize());
    group.add(mast, panel, halo, shaft);
  }
  return beam;
}

/* ---------- City ---------- */

const CELL = 62;
const ROAD = 12;
/** Half-width of the painted street plan, in metres. */
const PLAN_HALF = 720;
/** The plaza is an ellipse this "radius" deep (x is stretched to match the stadium). */
const PLAZA = 215;
const PLAZA_STRETCH = 1.15;

const inPlaza = (x: number, z: number) => Math.hypot(x / PLAZA_STRETCH, z) < PLAZA;
/** The cathedral's forecourt, kept clear of buildings. */
const inForecourt = (x: number, z: number) => Math.abs(x) < 70 && z > 0 && z < 290;

type Facade = "brick" | "flats" | "office";

/** A facade and its matching emissive map (lit windows only), so walls take light but windows glow. */
function makeFacade(kind: Facade) {
  const [cols, rows, w, h] = kind === "brick" ? [5, 3, 80, 48] : kind === "flats" ? [6, 12, 72, 144] : [8, 18, 64, 144];
  const color = document.createElement("canvas");
  const lit = document.createElement("canvas");
  color.width = lit.width = w;
  color.height = lit.height = h;
  const c = color.getContext("2d")!;
  const e = lit.getContext("2d")!;
  e.fillStyle = "#000";
  e.fillRect(0, 0, w, h);

  if (kind === "brick") {
    c.fillStyle = "#3a1f1a";
    c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(0, y, w, 1);
      for (let x = (y / 4) % 2 ? 4 : 0; x < w; x += 8) c.fillRect(x, y, 1, 4);
    }
  } else if (kind === "flats") {
    c.fillStyle = "#33353b";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#24262b";
    for (let r = 0; r < rows; r++) c.fillRect(0, r * (h / rows), w, 2); // balcony slabs
  } else {
    c.fillStyle = "#1a2029";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#0e1218";
    for (let col = 0; col < cols; col++) c.fillRect(col * (w / cols), 0, 1, h); // curtain-wall mullions
  }

  const cw = w / cols;
  const ch = h / rows;
  const chance = kind === "brick" ? 0.22 : kind === "flats" ? 0.14 : 0.16;
  const palette = kind === "office" ? ["#dfeaff", "#bfd8ff", "#3de0ff"] : ["#ffd9a0", "#ffc070", "#ff9a5a"];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw + cw * 0.22;
      const y = r * ch + ch * 0.25;
      const ww = cw * 0.56;
      const wh = ch * (kind === "brick" ? 0.5 : 0.55);
      if (Math.random() < chance) {
        const glow = Math.random() < 0.06 ? "#ff2d55" : palette[Math.floor(Math.random() * palette.length)];
        c.fillStyle = glow;
        c.fillRect(x, y, ww, wh);
        e.fillStyle = glow;
        e.fillRect(x, y, ww, wh);
      } else {
        c.fillStyle = kind === "office" ? "#10161f" : "#0a0b0e";
        c.fillRect(x, y, ww, wh);
      }
    }
  }
  const finish = (canvas: HTMLCanvasElement) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  };
  const walls = new THREE.MeshLambertMaterial({ map: finish(color), emissiveMap: finish(lit), emissive: 0xffffff, emissiveIntensity: 1 });
  const roof = new THREE.MeshLambertMaterial({ color: kind === "brick" ? 0x14161b : 0x0c0d11 });
  return [walls, walls, roof, roof, walls, walls];
}

type CellKind = "church" | "gas" | "factory" | "terrace" | "flats" | "office" | "park" | "court";
interface Cell { cx: number; cz: number; kind: CellKind; yaw: number }

/** Decide what stands on every city block before anything is drawn, so the ground plan and the buildings agree. */
function layoutCity(reach: number): Cell[] {
  const cells: Cell[] = [];
  const half = CELL / 2;
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const cx = i * CELL;
      const cz = j * CELL;
      // A block is skipped if any corner of it would poke into the plaza or forecourt
      if ([[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].some(([dx, dz]) => inPlaza(cx + dx * half, cz + dz * half) || inForecourt(cx + dx * half, cz + dz * half))) continue;
      if (i === 0 || j === 0) continue; // the boulevards that run out from each door
      const roll = Math.random();
      const near = Math.hypot(cx, cz) < 360;
      const kind: CellKind =
        roll < 0.03 ? "church" : roll < 0.055 ? "gas" : roll < 0.09 ? "factory" : roll < 0.16 ? "park" : roll < 0.2 ? "court"
        : near || roll < 0.42 ? "terrace" : roll < 0.74 ? "flats" : "office";
      cells.push({ cx, cz, kind, yaw: Math.random() < 0.5 ? 0 : Math.PI / 2 });
    }
  }
  return cells;
}

const plazaPoint = (angle: number, rho: number): [number, number] => [Math.cos(angle) * PLAZA * PLAZA_STRETCH * rho, Math.sin(angle) * PLAZA * rho];

interface PlazaSpot { x: number; z: number; angle: number; kind: "pond" | "fountain" | "obelisk" | "grove" }

/** Four parks on the diagonals and a ring of small squares between them. */
function layoutPlaza(): PlazaSpot[] {
  const spots: PlazaSpot[] = [];
  for (let k = 0; k < 4; k++) {
    const angle = Math.PI / 4 + (k * Math.PI) / 2;
    const [x, z] = plazaPoint(angle, 0.77);
    spots.push({ x, z, angle, kind: k % 2 ? "pond" : "fountain" });
  }
  for (let k = 0; k < 8; k++) {
    const angle = Math.PI / 8 + (k * Math.PI) / 4;
    const [x, z] = plazaPoint(angle, 0.7);
    if (Math.abs(x) < 95 && z > 0) continue; // the cathedral forecourt
    spots.push({ x, z, angle, kind: k % 2 ? "obelisk" : "grove" });
  }
  return spots;
}

/**
 * The ground, painted onto one texture: grid roads, the ring road and avenues,
 * the paved plaza with its lawns, ponds and squares, and for every city block
 * the gardens, car parks, courts and yards that belong to what stands on it.
 */
function makeStreetPlan(reach: number, cells: Cell[], spots: PlazaSpot[], lamps: XZ[]) {
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const k = size / (PLAN_HALF * 2);
  const px = (v: number) => (v + PLAN_HALF) * k;
  const asphalt = "#22252b";
  const marking = "#50545c";
  const grass = "#0b1b13";
  const paving = "#1f2228";
  const lot = (CELL - ROAD - 2) * k;

  ctx.fillStyle = asphalt; // everything between the blocks is road
  ctx.fillRect(0, 0, size, size);

  // Each block: a pavement kerb, then whatever its building needs around it
  for (const cell of cells) {
    ctx.save();
    ctx.translate(px(cell.cx), px(cell.cz));
    ctx.rotate(cell.yaw);
    ctx.fillStyle = "#17191d";
    ctx.fillRect(-lot / 2, -lot / 2, lot, lot);
    const inner = lot - 5 * k;
    const fill = (color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(x * k, y * k, w * k, h * k); };
    const line = (color: string, pts: number[]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let p = 0; p < pts.length; p += 4) { ctx.moveTo(pts[p] * k, pts[p + 1] * k); ctx.lineTo(pts[p + 2] * k, pts[p + 3] * k); }
      ctx.stroke();
    };
    switch (cell.kind) {
      case "terrace":
        // Back gardens between the two rows, fenced into plots
        fill(grass, -22, -4, 44, 8);
        line("#0b1a12", Array.from({ length: 9 }, (_, n) => [-20 + n * 5, -4, -20 + n * 5, 4]).flat());
        break;
      case "flats":
        ctx.fillStyle = grass;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);
        fill("#1b1d22", -22, 13, 44, 9); // car park
        line(marking, Array.from({ length: 13 }, (_, n) => [-21 + n * 3.5, 13, -21 + n * 3.5, 17]).flat());
        break;
      case "office":
        ctx.fillStyle = paving;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);
        for (const [x, y] of [[-20, -20], [16, -20], [-20, 16], [16, 16]]) fill(grass, x, y, 4, 4); // planters
        break;
      case "church":
        ctx.fillStyle = grass;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);
        line("#3a3d44", [0, -22, 0, 22, -22, 10, 22, 10]);
        break;
      case "park":
        ctx.fillStyle = "#0d2018";
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);
        line("#4a4d55", [-22, -22, 22, 22, -22, 22, 22, -22]);
        ctx.fillStyle = "#0b1b2a";
        ctx.beginPath(); ctx.arc(9 * k, -10 * k, 6 * k, 0, Math.PI * 2); ctx.fill();
        break;
      case "court":
        ctx.fillStyle = grass;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);
        // A caged five-a-side pitch and a hard court
        fill("#0f2f20", -20, -18, 40, 20);
        line("#d7dae3", [-20, -18, 20, -18, 20, -18, 20, 2, 20, 2, -20, 2, -20, 2, -20, -18, 0, -18, 0, 2]);
        ctx.strokeStyle = "#d7dae3"; ctx.beginPath(); ctx.arc(0, -8 * k, 3 * k, 0, Math.PI * 2); ctx.stroke();
        fill("#3a1719", -14, 7, 28, 13);
        line("#d7dae3", [-14, 7, 14, 7, 14, 7, 14, 20, 14, 20, -14, 20, -14, 20, -14, 7, 0, 7, 0, 20]);
        break;
      default:
        fill("#1a1712", -22, -22, 44, 44); // works yard
    }
    ctx.restore();
  }

  // Boulevards along both axes: pavement, a grass verge either side, the carriageway down the middle
  const boulevard = (x: number, z: number, w: number, h: number, alongX: boolean) => {
    ctx.fillStyle = "#17191d";
    ctx.fillRect(px(x), px(z), w * k, h * k);
    ctx.fillStyle = grass;
    for (const side of [-1, 1]) {
      if (alongX) ctx.fillRect(px(x), px(side * 17 - 4.5), w * k, 9 * k);
      else ctx.fillRect(px(side * 17 - 4.5), px(z), 9 * k, h * k);
    }
  };
  const lane = CELL / 2 - ROAD / 2;
  boulevard(-PLAN_HALF, -lane, PLAN_HALF * 2, lane * 2, true);
  boulevard(-lane, -PLAN_HALF, lane * 2, PLAN_HALF * 2, false);

  // Centre lines down every grid road
  ctx.strokeStyle = marking;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  for (let i = -reach - 1; i <= reach; i++) {
    const at = px((i + 0.5) * CELL);
    ctx.moveTo(at, 0); ctx.lineTo(at, size);
    ctx.moveTo(0, at); ctx.lineTo(size, at);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Plaza: stone paving in rings and spokes, wiping out the grid inside it
  const plaza = (scale: number) => {
    ctx.beginPath();
    ctx.ellipse(px(0), px(0), PLAZA * PLAZA_STRETCH * scale * k, PLAZA * scale * k, 0, 0, Math.PI * 2);
  };
  plaza(1);
  ctx.fillStyle = "#15171b";
  ctx.fill();
  ctx.fillRect(px(-70), px(0), 140 * k, 290 * k); // cathedral forecourt
  // Processional ways from each door, in a lighter stone
  ctx.fillStyle = paving;
  ctx.fillRect(px(-PLAZA * PLAZA_STRETCH), px(-9), PLAZA * PLAZA_STRETCH * 2 * k, 18 * k);
  ctx.fillRect(px(-9), px(-PLAZA), 18 * k, PLAZA * k);
  ctx.fillRect(px(-26), px(0), 52 * k, 290 * k);

  for (const spot of spots) {
    ctx.save();
    ctx.translate(px(spot.x), px(spot.z));
    if (spot.kind === "pond" || spot.kind === "fountain") {
      // A lawn lying along the curve of the plaza, with a path round its centrepiece
      ctx.rotate(spot.angle + Math.PI / 2);
      ctx.fillStyle = "#0d2018";
      ctx.beginPath(); ctx.ellipse(0, 0, 54 * k, 31 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#4a4d55";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 40 * k, 19 * k, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-54 * k, 0); ctx.lineTo(54 * k, 0); ctx.stroke();
      ctx.fillStyle = spot.kind === "pond" ? "#0b1d2c" : paving;
      ctx.beginPath(); ctx.arc(0, 0, (spot.kind === "pond" ? 12 : 13) * k, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = "#262a31";
      ctx.beginPath(); ctx.arc(0, 0, 15 * k, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#3a3e47";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 9 * k, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // Ring road round the plaza, and avenues from it out through the grid
  ctx.strokeStyle = asphalt;
  ctx.lineWidth = (ROAD + 4) * k;
  plaza(0.97);
  ctx.stroke();
  ctx.fillStyle = asphalt;
  const avenue = (ROAD + 6) * k;
  ctx.fillRect(px(-PLAN_HALF), px(0) - avenue / 2, (PLAN_HALF - PLAZA * PLAZA_STRETCH) * k, avenue);
  ctx.fillRect(px(PLAZA * PLAZA_STRETCH), px(0) - avenue / 2, (PLAN_HALF - PLAZA * PLAZA_STRETCH) * k, avenue);
  ctx.fillRect(px(0) - avenue / 2, px(-PLAN_HALF), avenue, (PLAN_HALF - PLAZA) * k);
  ctx.fillRect(px(0) - avenue / 2, px(290), avenue, (PLAN_HALF - 290) * k);
  ctx.strokeStyle = marking;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 7]);
  plaza(0.97);
  ctx.stroke();

  weatherGround(ctx, size, (x, z) => inPlaza(x, z) || inForecourt(x, z), (px0) => px0 / k - PLAN_HALF);

  // Lamplight: a warm pool under every street lamp, multiplied over the plan so it lights what is really there
  const light = document.createElement("canvas");
  light.width = light.height = size;
  const glow = light.getContext("2d")!;
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, size, size);
  glow.globalCompositeOperation = "lighter";
  for (const [x, z] of lamps) pool(glow, px(x), px(z), 21 * k);
  return { map: toTexture(canvas), glow: toTexture(lit(canvas, light, 1.9)) };
}

/** Collects instance matrices per mesh kind, then emits one InstancedMesh for each. */
class Batch {
  private matrices: THREE.Matrix4[] = [];
  private static q = new THREE.Quaternion();
  private static up = new THREE.Vector3(0, 1, 0);
  constructor(private geometry: THREE.BufferGeometry, private material: THREE.Material | THREE.Material[]) {}
  add(x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw = 0) {
    Batch.q.setFromAxisAngle(Batch.up, yaw);
    this.matrices.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Batch.q, new THREE.Vector3(sx, sy, sz)));
  }
  addTo(scene: THREE.Scene) {
    if (this.matrices.length === 0) return;
    const mesh = new THREE.InstancedMesh(this.geometry, this.material, this.matrices.length);
    this.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    scene.add(mesh);
  }
}

/**
 * Breaks up the flat painted plan so it reads as ground rather than a drawing:
 * irregular flagstones on the plaza, fine grain everywhere, dark damp patches
 * and a scatter of puddles.
 */
function weatherGround(ctx: CanvasRenderingContext2D, size: number, paved: (x: number, z: number) => boolean, toWorld: (px: number) => number) {
  // Flagstones: jittered joints, each slab a slightly different grey
  const slab = 9;
  for (let gy = 0; gy < size; gy += slab) {
    let gx = (gy / slab) % 2 ? -4 : 0;
    while (gx < size) {
      const w = slab + Math.random() * 9;
      if (paved(toWorld(gx + w / 2), toWorld(gy + slab / 2))) {
        const tone = Math.random();
        ctx.fillStyle = tone < 0.5 ? `rgba(255,255,255,${(0.012 + tone * 0.05).toFixed(3)})` : `rgba(0,0,0,${(tone * 0.22).toFixed(3)})`;
        ctx.fillRect(gx, gy, w - 0.8, slab - 0.8);
      }
      gx += w;
    }
  }
  // Fine grain over everything
  for (let i = 0; i < 90000; i++) {
    const light = Math.random() < 0.45;
    ctx.fillStyle = light ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.16)";
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // Damp patches and puddles: soft dark blots of every size
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() ** 2 * 60;
    const blot = ctx.createRadialGradient(x, y, 0, x, y, r);
    blot.addColorStop(0, `rgba(0,0,0,${(0.1 + Math.random() * 0.2).toFixed(2)})`);
    blot.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = blot;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.4 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- Roads and street lamps ---------- */

const SEGMENT = CELL - ROAD; // length of road between two junctions
const LAMP_GLOW = "255,196,110";

/** Where the two lamps stand on every road segment, in the segment's own frame (x along the road). */
const SEGMENT_LAMPS: [number, number][] = [[-SEGMENT / 4, -(ROAD / 2 + 1.3)], [SEGMENT / 4, ROAD / 2 + 1.3]];

function canvasPair(w: number, h: number) {
  const make = () => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  };
  return [make(), make()] as const;
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Warm pool of lamplight, drawn additively onto a black canvas that is later multiplied over the surface. */
function pool(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, strength = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(${LAMP_GLOW},${strength})`);
  g.addColorStop(0.35, `rgba(${LAMP_GLOW},${strength * 0.5})`);
  g.addColorStop(1, `rgba(${LAMP_GLOW},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/** `surface` brightened and multiplied by `light`: what the surface looks like where the lamps reach it. */
function lit(surface: HTMLCanvasElement, light: HTMLCanvasElement, gain: number) {
  const out = document.createElement("canvas");
  out.width = surface.width;
  out.height = surface.height;
  const ctx = out.getContext("2d")!;
  ctx.filter = `brightness(${gain})`;
  ctx.drawImage(surface, 0, 0);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(light, 0, 0);
  return out;
}

/**
 * The two modelled road pieces, each as a surface texture plus its lamplit
 * version: a stretch of road with granite kerbs, gutters, a dashed centre line,
 * patches and a manhole; and a junction with zebra crossings on all four arms.
 */
function makeRoadPieces() {
  const scale = 8; // pixels per metre
  const kerb = (ctx: CanvasRenderingContext2D, length: number, y: number) => {
    for (let x = 0; x < length; x += 9) {
      const v = 70 + Math.random() * 34;
      ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
      ctx.fillRect(x + 0.5, y, 8, 6);
    }
  };
  const grain = (ctx: CanvasRenderingContext2D, w: number, h: number, count: number) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.22)";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  };

  // Straight segment
  const w = SEGMENT * scale;
  const h = ROAD * scale;
  const [road, roadLight] = canvasPair(w, h);
  let ctx = road.getContext("2d")!;
  ctx.fillStyle = "#2b2e34";
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 5000);
  for (let i = 0; i < 5; i++) { // tarmac repairs
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(Math.random() * w, 10 + Math.random() * (h - 30), 20 + Math.random() * 50, 8 + Math.random() * 14);
  }
  ctx.fillStyle = "#15171a"; // gutters
  ctx.fillRect(0, 6, w, 3);
  ctx.fillRect(0, h - 9, w, 3);
  kerb(ctx, w, 0);
  kerb(ctx, w, h - 6);
  ctx.fillStyle = "#b9a56a"; // centre line
  for (let x = 8; x < w; x += 44) ctx.fillRect(x, h / 2 - 1, 24, 2);
  ctx.strokeStyle = "#0f1012"; // manhole
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(w * 0.62, h * 0.32, 5, 0, Math.PI * 2); ctx.stroke();
  ctx = roadLight.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  for (const [lx, lz] of SEGMENT_LAMPS) pool(ctx, (lx + SEGMENT / 2) * scale, (lz + ROAD / 2) * scale, 17 * scale);

  // Junction
  const j = ROAD * scale;
  const [cross, crossLight] = canvasPair(j, j);
  ctx = cross.getContext("2d")!;
  ctx.fillStyle = "#2b2e34";
  ctx.fillRect(0, 0, j, j);
  grain(ctx, j, j, 900);
  ctx.fillStyle = "#8f9299";
  for (let s = 10; s < j - 8; s += 12) { // zebra stripes on each arm
    ctx.fillRect(s, 2, 6, 14); ctx.fillRect(s, j - 16, 6, 14);
    ctx.fillRect(2, s, 14, 6); ctx.fillRect(j - 16, s, 14, 6);
  }
  ctx = crossLight.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, j, j);
  ctx.globalCompositeOperation = "lighter";
  pool(ctx, j / 2, j / 2, j * 1.1, 0.34); // spill from the lamps down each arm

  const material = (surface: HTMLCanvasElement, light: HTMLCanvasElement) =>
    new THREE.MeshLambertMaterial({ map: toTexture(surface), color: 0x5a5a60, emissiveMap: toTexture(lit(surface, light, 1.8)), emissive: 0xffffff, emissiveIntensity: 1 });
  return {
    segment: new Batch(new THREE.PlaneGeometry(SEGMENT, ROAD).rotateX(-Math.PI / 2), material(road, roadLight)),
    junction: new Batch(new THREE.PlaneGeometry(ROAD, ROAD).rotateX(-Math.PI / 2), material(cross, crossLight)),
  };
}

/**
 * A gothic street lamp in instanced parts: a stepped base, a slender iron
 * post with a collar, a hexagonal lantern glowing dim yellow, and a pointed
 * cap with a finial. `add` plants one and returns nothing; `finish` puts
 * every lamp and its halo into the scene.
 */
function makeLamps(scene: THREE.Scene, kit: Kit) {
  const iron = new THREE.MeshLambertMaterial({ color: 0x08080a });
  const parts = {
    base: new Batch(new THREE.CylinderGeometry(0.45, 0.75, 1, 6), iron),
    post: new Batch(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), iron),
    collar: new Batch(new THREE.CylinderGeometry(0.34, 0.2, 1, 6), iron),
    lantern: new Batch(new THREE.CylinderGeometry(0.62, 0.42, 1, 6), new THREE.MeshBasicMaterial({ color: 0xd9a03c })),
    cap: new Batch(new THREE.ConeGeometry(0.85, 1, 6), iron),
    finial: new Batch(new THREE.ConeGeometry(0.12, 1, 4), iron),
  };
  const halos: number[] = [];
  const spots: XZ[] = [];
  return {
    spots,
    add(x: number, z: number, s = 1) {
      // About 5 m tall, so every tree stands above it; drawn a little stout so it still reads from the blimp
      const w = s * 1.5;
      parts.base.add(x, 0.35 * s, z, w, 0.7 * s, w);
      parts.post.add(x, 1.7 * s, z, w, 2 * s, w);
      parts.collar.add(x, 2.85 * s, z, w, 0.3 * s, w);
      parts.lantern.add(x, 3.45 * s, z, w, 0.9 * s, w);
      parts.cap.add(x, 4.25 * s, z, w, 0.7 * s, w);
      parts.finial.add(x, 4.85 * s, z, w, 0.5 * s, w);
      halos.push(x, 3.45 * s, z);
      spots.push([x, z]);
    },
    finish() {
      Object.values(parts).forEach((part) => part.addTo(scene));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(halos, 3));
      scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
        map: kit.glow, color: 0xffb040, size: 10, sizeAttenuation: true, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false,
      })));
    },
  };
}

const NEON = new THREE.Color(NEON_RED);

interface NeonSpire {
  light: THREE.PointLight;
  tubes: THREE.MeshBasicMaterial;
  halo: THREE.Sprite;
  beam: THREE.Mesh;
  phase: number;
}

/** A freestanding gothic spire outlined in neon: stone drum, buttress fins, a tall slate cone with glowing ribs. */
function buildNeonSpire(scene: THREE.Scene, kit: Kit, base: THREE.Vector3, outward: THREE.Vector2, index: number): NeonSpire {
  const drumHeight = 22;
  const coneHeight = 58 + index * 5;
  const radius = 6;
  const spire = new THREE.Group();
  spire.position.copy(base);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 1.15, drumHeight, 8), kit.stone(3, 2));
  drum.position.y = drumHeight / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, coneHeight, 8), kit.slate);
  cone.position.y = drumHeight + coneHeight / 2;
  spire.add(drum, cone);

  const tubes = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const up = new THREE.Vector3(0, 1, 0);
  const tip = new THREE.Vector3(0, drumHeight + coneHeight, 0);
  for (let s = 0; s < 8; s++) {
    const angle = (s * Math.PI) / 4;
    // ConeGeometry puts its corners at (sin, cos), so the ribs run exactly along the arrises
    const foot = new THREE.Vector3(Math.sin(angle) * radius, drumHeight, Math.cos(angle) * radius);
    const run = tip.clone().sub(foot);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, run.length(), 5), tubes);
    rib.position.copy(foot).addScaledVector(run, 0.5);
    rib.quaternion.setFromUnitVectors(up, run.clone().normalize());
    spire.add(rib);

    const mid = angle + Math.PI / 8;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1, drumHeight * 0.8, 4.5), kit.stone(0.3, 2));
    fin.position.set(Math.sin(mid) * (radius + 2.4), drumHeight * 0.4, Math.cos(mid) * (radius + 2.4));
    fin.rotation.y = mid;
    const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 4), kit.slate);
    pinnacle.position.set(Math.sin(mid) * (radius + 3.6), drumHeight * 0.8 + 3.5, Math.cos(mid) * (radius + 3.6));
    const slit = new THREE.Mesh(glassPane(lancet(1.6, 9), 6), tubes);
    slit.position.set(Math.sin(angle) * (radius * 1.02), 7, Math.cos(angle) * (radius * 1.02));
    slit.rotation.y = angle;
    spire.add(fin, pinnacle, slit);
  }
  for (const [y, r] of [[drumHeight, radius + 0.25], [drumHeight + coneHeight * 0.45, radius * 0.55 + 0.25]] as const) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.24, 5, 8), tubes);
    band.rotation.set(Math.PI / 2, 0, Math.PI / 8);
    band.position.y = y;
    spire.add(band);
  }
  const cross = new THREE.Mesh(crossGeometry(4), kit.chrome);
  cross.position.copy(tip).setY(tip.y - 0.5);
  spire.add(cross);
  scene.add(spire);

  const halo = glowSprite(kit, 0xffffff, 95, 0.5);
  halo.position.copy(base).setY(drumHeight + coneHeight * 0.5);
  scene.add(halo);

  // The light sits on the city side with a short reach, so it colours the
  // streets and blocks behind the spire and never touches the stadium.
  const light = new THREE.PointLight(0xffffff, 0, 165, 1.25);
  light.position.set(base.x + outward.x * 74, 40, base.z + outward.y * 66);
  scene.add(light);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 18, 300, 16, 1, true).translate(0, -150, 0).rotateX(Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
  );
  beam.position.copy(base).setY(tip.y);
  scene.add(beam);
  return { light, tubes, halo, beam, phase: index / 4 };
}

/**
 * The city around the plaza, kept low-resolution: brick terraces with gardens
 * close in, slab blocks and glass towers further out, churches, gasometers,
 * factories, parks and five-a-side cages, on a painted street grid with
 * trees, parked cars, lamps and traffic. The plaza itself has four parks,
 * a ring of small squares, tree-lined walks and people.
 */
function buildCity(scene: THREE.Scene, kit: Kit, small: boolean) {
  const reach = small ? 7 : 11;
  const cells = layoutCity(reach);
  const spots = layoutPlaza();

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const gable = new THREE.Shape();
  gable.moveTo(-0.5, 0); gable.lineTo(0.5, 0); gable.lineTo(0, 1); gable.closePath();
  const unitRoof = new THREE.ExtrudeGeometry(gable, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5);
  const lambert = (color: number, flat = false) => new THREE.MeshLambertMaterial({ color, flatShading: flat });

  const slateRoof = lambert(0x15181e);
  const metal = lambert(0x1b1e24);
  const blob = new THREE.IcosahedronGeometry(0.5, 1);
  const batch = {
    brick: new Batch(unitBox, makeFacade("brick")),
    flats: new Batch(unitBox, makeFacade("flats")),
    office: new Batch(unitBox, makeFacade("office")),
    plain: new Batch(unitBox, metal),
    stone: new Batch(unitBox, lambert(0x2b2d33)),
    roofs: new Batch(unitRoof, slateRoof),
    drums: new Batch(new THREE.CylinderGeometry(0.5, 0.5, 1, 20), metal),
    spires: new Batch(new THREE.ConeGeometry(0.5, 1, 6), slateRoof),
    trunks: new Batch(new THREE.CylinderGeometry(0.35, 0.5, 1, 5), lambert(0x241a14)),
    leavesA: new Batch(blob, lambert(0x0f2a1c, true)),
    leavesB: new Batch(blob, lambert(0x0b2117, true)),
    conifers: new Batch(new THREE.ConeGeometry(0.5, 1, 6), lambert(0x091c15, true)),
    benches: new Batch(unitBox, lambert(0x33271f)),
    carsDark: new Batch(unitBox, lambert(0x2c3038)),
    carsLight: new Batch(unitBox, lambert(0x6d717b)),
    carsRed: new Batch(unitBox, lambert(0x43131a)),
    awnings: new Batch(unitRoof, lambert(0x47121d)),
  };

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const tree = (x: number, z: number, s = 1) => {
    batch.trunks.add(x, 2.2 * s, z, s, 4.4 * s, s);
    const roll = Math.random();
    if (roll < 0.22) batch.conifers.add(x, 9 * s, z, 5.5 * s, 11 * s, 5.5 * s);
    else (roll < 0.62 ? batch.leavesA : batch.leavesB).add(x, 7.4 * s, z, rand(6, 8) * s, rand(6.5, 8) * s, rand(6, 8) * s, Math.random() * 3);
  };
  const bench = (x: number, z: number, yaw: number) => batch.benches.add(x, 0.5, z, 2.8, 0.7, 0.9, yaw);

  const lamps = makeLamps(scene, kit);
  const lamp = lamps.add;
  const roads = makeRoadPieces();
  const beacons: number[] = [];
  const people: number[] = [];
  const peopleColors: number[] = [];
  const cloth = [0x9a9ea8, 0x5f6470, 0xd7dae3, 0xc21a40, 0x30333f].map((hex) => new THREE.Color(hex));
  const person = (x: number, z: number) => {
    const c = cloth[Math.floor(Math.random() * cloth.length)];
    people.push(x, 1.2, z);
    peopleColors.push(c.r, c.g, c.b);
  };
  const lot = CELL - ROAD - 6;

  /* --- City blocks --- */
  for (const { cx, cz, kind, yaw } of cells) {
    // Local (along, across) on the block -> world, turned by the block's yaw
    const at = (a: number, b: number): [number, number] => (yaw ? [cx + b, cz + a] : [cx + a, cz + b]);

    if (kind === "church") {
      batch.stone.add(cx, 9, cz, 14, 18, 34, yaw);
      batch.roofs.add(cx, 18, cz, 15, 9, 34, yaw);
      const [tx, tz] = yaw ? [cx + 21, cz] : [cx, cz + 21];
      batch.stone.add(tx, 16, tz, 8, 32, 8);
      batch.spires.add(tx, 43, tz, 9, 22, 9);
      for (let n = 0; n < 6; n++) tree(cx + rand(-21, 21), cz + rand(-21, 21), rand(0.8, 1.1));
    } else if (kind === "gas") {
      const r = rand(15, 20);
      batch.drums.add(cx, 9, cz, r * 2, 18, r * 2);
      batch.drums.add(cx, 23, cz, r * 2 + 1.5, 1, r * 2 + 1.5);
      for (let p = 0; p < 8; p++) batch.plain.add(cx + Math.cos(p * 0.785) * r, 13, cz + Math.sin(p * 0.785) * r, 0.8, 26, 0.8);
    } else if (kind === "factory") {
      batch.brick.add(cx, 7, cz, lot, 14, 26, yaw);
      batch.roofs.add(cx, 14, cz, 26, 7, lot, yaw + Math.PI / 2);
      for (const side of [-1, 1]) {
        const [sx, sz] = at(side * 14, 18);
        batch.drums.add(sx, 20, sz, 3.4, 40, 3.4);
        beacons.push(sx, 41, sz);
      }
    } else if (kind === "terrace") {
      for (const side of [-1, 1]) {
        const h = rand(8, 11);
        const [x, z] = at(0, side * 12);
        batch.brick.add(x, h / 2, z, lot, h, 13, yaw);
        batch.roofs.add(x, h, z, 14, 5.5, lot, yaw + Math.PI / 2);
        for (let c = -2; c <= 2; c++) { const [qx, qz] = at(c * 9, side * 12); batch.plain.add(qx, h + 5, qz, 1.4, 3.5, 1.4); }
      }
      for (let n = 0; n < 4; n++) { const [x, z] = at(rand(-20, 20), rand(-2.5, 2.5)); tree(x, z, 0.6); }
    } else if (kind === "flats") {
      const slabs = Math.random() < 0.5 ? 2 : 1;
      for (let s = 0; s < slabs; s++) {
        const h = rand(20, 46);
        const [x, z] = at(slabs === 2 ? (s - 0.5) * 24 : 0, -6);
        batch.flats.add(x, h / 2, z, 16, h, lot - 14, yaw + Math.PI / 2);
        batch.plain.add(x, h + 1.5, z, 7, 3, 9, yaw);
      }
      for (let n = 0; n < 5; n++) { const [x, z] = at(rand(-21, 21), rand(-22, 8)); if (Math.random() < 0.6) tree(x, z, rand(0.7, 1)); }
      for (let n = 0; n < 12; n++) {
        if (Math.random() < 0.45) continue;
        const [x, z] = at(-19.3 + n * 3.5, 15.2);
        (Math.random() < 0.5 ? batch.carsDark : Math.random() < 0.7 ? batch.carsLight : batch.carsRed).add(x, 0.8, z, 1.9, 1.4, 4.2, yaw);
      }
    } else if (kind === "office") {
      const w = rand(24, 32);
      const h = rand(48, 120);
      batch.office.add(cx, h / 2, cz, w, h, w);
      let top = h;
      if (Math.random() < 0.5) { batch.office.add(cx, h + h * 0.16, cz, w * 0.62, h * 0.32, w * 0.62); top = h * 1.32; }
      if (Math.random() < 0.5) { batch.plain.add(cx, top + 9, cz, 0.7, 18, 0.7); beacons.push(cx, top + 18.5, cz); }
      for (const [x, z] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) tree(cx + x, cz + z, 0.7);
    } else if (kind === "park") {
      for (let n = 0; n < 16; n++) { const [x, z] = at(rand(-21, 21), rand(-21, 21)); if (Math.hypot(x - at(9, -10)[0], z - at(9, -10)[1]) > 8) tree(x, z, rand(0.8, 1.25)); }
      for (let n = 0; n < 4; n++) { const a = n * 1.57; const [x, z] = at(9 + Math.cos(a) * 8, -10 + Math.sin(a) * 8); bench(x, z, a); }
      for (let n = 0; n < 8; n++) { const [x, z] = at(rand(-20, 20), rand(-20, 20)); person(x, z); }
    } else {
      // Cage fence posts and floodlights round the five-a-side pitch
      for (const [a, b] of [[-20, -18], [20, -18], [-20, 2], [20, 2]]) { const [x, z] = at(a, b); batch.plain.add(x, 4, z, 0.5, 8, 0.5); lamp(x, z, 0.8); }
      for (let n = 0; n < 10; n++) { const [x, z] = at(rand(-18, 18), rand(-16, 0)); person(x, z); }
      for (let n = 0; n < 5; n++) { const [x, z] = at(rand(-21, 21), rand(8, 21)); tree(x, z, 0.8); }
    }

    if (small) continue;
    // Street trees on the pavement and cars parked at the kerb, on all four sides
    for (const [ex, ez] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let t = -18; t <= 18; t += 9) {
        const px = cx + ex * (lot / 2 + 2.6) + (ex ? 0 : t);
        const pz = cz + ez * (lot / 2 + 2.6) + (ez ? 0 : t);
        if (Math.random() < 0.45) tree(px, pz, 0.62);
        if (Math.random() < 0.3) {
          const car = Math.random() < 0.5 ? batch.carsDark : Math.random() < 0.7 ? batch.carsLight : batch.carsRed;
          car.add(cx + ex * (CELL / 2 - 4.4) + (ex ? 0 : t + 4), 0.8, cz + ez * (CELL / 2 - 4.4) + (ez ? 0 : t + 4), 1.9, 1.4, 4.2, ex ? 0 : Math.PI / 2);
        }
      }
    }
  }

  /* --- Grid roads: a modelled piece between every pair of junctions, two lamps on each --- */
  const clearRoad = (x: number, z: number) => !inPlaza(x, z) && !inForecourt(x, z);
  for (let i = -reach - 1; i <= reach; i++) {
    const line = (i + 0.5) * CELL;
    for (let j = -reach - 1; j <= reach; j++) {
      const cross = (j + 0.5) * CELL;
      if (clearRoad(line, cross)) roads.junction.add(line, 0, cross, 1, 1, 1);
      if (j < -reach) continue;
      const mid = j * CELL;
      // One piece along x (on the line z = `line`) and one along z (on x = `line`)
      for (const alongX of [true, false]) {
        const [x, z] = alongX ? [mid, line] : [line, mid];
        const ends: XZ[] = alongX ? [[x - SEGMENT / 2, z], [x + SEGMENT / 2, z]] : [[x, z - SEGMENT / 2], [x, z + SEGMENT / 2]];
        if (!ends.every(([ex, ez]) => clearRoad(ex, ez))) continue;
        roads.segment.add(x, 0, z, 1, 1, 1, alongX ? 0 : Math.PI / 2);
        // A quarter-turn about Y sends the piece's (x, z) to (z, -x)
        for (const [lx, lz] of SEGMENT_LAMPS) lamp(alongX ? x + lx : x + lz, alongX ? z + lz : z - lx);
      }
    }
  }
  roads.segment.addTo(scene);
  roads.junction.addTo(scene);

  /* --- Boulevards: trees on the verges, lamps along the carriageway --- */
  const edge = (reach + 0.5) * CELL;
  for (let d = PLAZA * PLAZA_STRETCH + 16; d < edge; d += 13) {
    for (const side of [-1, 1]) for (const dir of [-1, 1]) {
      tree(dir * d, side * 17, 0.95);
      if (Math.round(d / 13) % 2 === 0) lamp(dir * d, side * 11.5);
    }
  }
  for (let d = PLAZA + 16; d < edge; d += 13) {
    for (const side of [-1, 1]) {
      tree(side * 17, -d, 0.95);
      if (Math.round(d / 13) % 2 === 0) lamp(side * 11.5, -d);
      if (d > 300) { tree(side * 17, d, 0.95); if (Math.round(d / 13) % 2 === 0) lamp(side * 11.5, d); }
    }
  }
  // Lamps round the outside of the ring road
  for (let n = 0; n < 84; n++) {
    const [x, z] = plazaPoint((n / 84) * Math.PI * 2, 1.035);
    if (Math.abs(z) > 16 && Math.abs(x) > 16) lamp(x, z);
  }

  /* --- The plaza --- */
  const clearOfWays = (x: number, z: number) => Math.abs(z) > 14 && !(Math.abs(x) < 14 && z < 0) && !(Math.abs(x) < 34 && z > 0);
  // A double row of trees and a line of lamps inside the ring road
  for (const [rho, count] of [[0.9, 150], [0.84, 136]] as const) {
    for (let n = 0; n < count; n++) {
      const [x, z] = plazaPoint((n / count) * Math.PI * 2, rho);
      if (clearOfWays(x, z)) tree(x, z, rand(0.85, 1.1));
    }
  }
  for (let n = 0; n < 72; n++) { const [x, z] = plazaPoint((n / 72) * Math.PI * 2, 0.8); lamp(x, z, 1.1); }
  // Avenues of trees and benches along each processional way
  for (let d = 0.6; d < 0.82; d += 0.036) {
    for (const side of [-1, 1]) {
      const along = PLAZA * PLAZA_STRETCH * d;
      for (const dir of [-1, 1]) { tree(dir * along, side * 13, 0.95); if (Math.random() < 0.7) bench(dir * along + 5, side * 10.5, 0); }
      tree(side * 13, -PLAZA * d, 0.95);
      if (Math.random() < 0.7) bench(side * 10.5, -PLAZA * d + 5, Math.PI / 2);
    }
  }
  for (let z = 150; z < 285; z += 13) for (const side of [-1, 1]) { tree(side * 30, z, 1.05); lamp(side * 24, z + 6, 1.1); }

  for (const spot of spots) {
    if (spot.kind === "pond" || spot.kind === "fountain") {
      const tangent = spot.angle + Math.PI / 2;
      const local = (u: number, v: number): [number, number] => [spot.x + u * Math.cos(tangent) - v * Math.sin(tangent), spot.z + u * Math.sin(tangent) + v * Math.cos(tangent)];
      for (let n = 0; n < 26; n++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const [u, v] = [Math.cos(a) * 50 * r, Math.sin(a) * 28 * r];
        if (Math.hypot(u, v) < 17) continue;
        const [x, z] = local(u, v);
        tree(x, z, rand(0.9, 1.35));
      }
      for (let n = 0; n < 8; n++) {
        const a = (n / 8) * Math.PI * 2;
        bench(spot.x + Math.cos(a) * 15.5, spot.z + Math.sin(a) * 15.5, -a + Math.PI / 2);
        lamp(spot.x + Math.cos(a + 0.4) * 19, spot.z + Math.sin(a + 0.4) * 19, 1.1);
      }
      for (let n = 0; n < 34; n++) { const a = Math.random() * 6.28; const r = rand(13, 40); const [x, z] = local(Math.cos(a) * r, Math.sin(a) * r * 0.55); person(x, z); }
      if (spot.kind === "fountain") {
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.6, 1.4, 24), kit.stone(4, 0.3));
        basin.position.set(spot.x, 0.7, spot.z);
        const water = new THREE.Mesh(new THREE.CircleGeometry(7.3, 24), new THREE.MeshBasicMaterial({ color: 0x12303f }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(spot.x, 1.45, spot.z);
        const jet = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 8), new THREE.MeshBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.28 }));
        jet.position.set(spot.x, 5.5, spot.z);
        const spray = glowSprite(kit, 0x7fa6c4, 26, 0.14);
        spray.position.set(spot.x, 7, spot.z);
        scene.add(basin, water, jet, spray);
      }
    } else {
      for (let n = 0; n < 8; n++) { const a = (n / 8) * Math.PI * 2; bench(spot.x + Math.cos(a) * 11.5, spot.z + Math.sin(a) * 11.5, -a + Math.PI / 2); }
      for (let n = 0; n < 26; n++) { const a = Math.random() * 6.28; const r = rand(3, 17); person(spot.x + Math.cos(a) * r, spot.z + Math.sin(a) * r); }
      for (let n = 0; n < 4; n++) { const a = n * 1.571 + 0.785; lamp(spot.x + Math.cos(a) * 13.5, spot.z + Math.sin(a) * 13.5, 1.1); }
      if (spot.kind === "obelisk") {
        const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.7, 15, 4), kit.stone(1, 3));
        obelisk.position.set(spot.x, 7.5, spot.z);
        obelisk.rotation.y = Math.PI / 4;
        const cross = new THREE.Mesh(crossGeometry(2.6), kit.chrome);
        cross.position.set(spot.x, 15, spot.z);
        cross.rotation.y = -spot.angle + Math.PI / 2;
        scene.add(obelisk, cross);
      } else {
        for (let n = 0; n < 5; n++) { const a = n * 1.257; tree(spot.x + Math.cos(a) * 4, spot.z + Math.sin(a) * 4, 1.1); }
      }
      // Two market stalls with striped awnings on the outer edge of each square
      for (const side of [-1, 1]) {
        const a = spot.angle + side * 0.11;
        const [x, z] = plazaPoint(a, 0.795);
        batch.stone.add(x, 1.6, z, 5, 3.2, 4, -a);
        batch.awnings.add(x, 3.2, z, 5.6, 1.8, 4.6, -a + Math.PI / 2);
      }
    }
  }
  // People drifting down the ways, across the forecourt and round the plaza
  for (let n = 0; n < (small ? 300 : 900); n++) {
    const roll = Math.random();
    // Only on the stretches outside the stadium, never across the pitch
    if (roll < 0.3) person((Math.random() < 0.5 ? 1 : -1) * rand(0.62, 0.92) * PLAZA * PLAZA_STRETCH, rand(-8, 8));
    else if (roll < 0.45) person(rand(-8, 8), -rand(0.62, 0.92) * PLAZA);
    else if (roll < 0.7) person(rand(-24, 24), rand(150, 285));
    else { const [x, z] = plazaPoint(Math.random() * 6.28, rand(0.66, 0.9)); person(x, z); }
  }

  Object.values(batch).forEach((b) => b.addTo(scene));

  const dots = (positions: number[], material: THREE.PointsMaterial, colors?: number[]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (colors) geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    scene.add(new THREE.Points(geometry, material));
    return material;
  };
  lamps.finish();
  dots(people, new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true }), peopleColors);
  const beaconMaterial = dots(beacons, new THREE.PointsMaterial({ color: 0xff2d2d, size: 3.4, sizeAttenuation: false, transparent: true }));

  // Matte and tinted almost to black, so the ground only shows where the lamps reach it;
  // a plain dark skirt beyond it is left for the fog to swallow
  const plan = makeStreetPlan(reach, cells, spots, lamps.spots);
  const streets = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAN_HALF * 2, PLAN_HALF * 2),
    new THREE.MeshLambertMaterial({ map: plan.map, color: 0x55555a, emissiveMap: plan.glow, emissive: 0xffffff, emissiveIntensity: 1 }),
  );
  streets.rotation.x = -Math.PI / 2;
  streets.position.y = -0.4;
  const skirt = new THREE.Mesh(new THREE.CircleGeometry(1500, 48), new THREE.MeshBasicMaterial({ color: 0x030304 }));
  skirt.rotation.x = -Math.PI / 2;
  skirt.position.y = -0.8;
  scene.add(streets, skirt);

  // Traffic: head and tail lights sliding along the grid roads, wrapped in the vertex shader
  const cars = small ? 220 : 520;
  const span = (reach + 0.5) * CELL;
  const lanes = new Float32Array(cars * 4);
  for (let c = 0; c < cars; c++) {
    const road = (Math.floor(Math.random() * (reach * 2 + 1)) - reach - 0.5) * CELL;
    const forward = Math.random() < 0.5 ? 1 : -1;
    lanes.set([Math.random() < 0.5 ? 0 : 1, road + forward * 2.6, Math.random() * span * 2, forward * rand(14, 26)], c * 4);
  }
  const carGeometry = new THREE.BufferGeometry();
  carGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cars * 3), 3));
  carGeometry.setAttribute("aLane", new THREE.BufferAttribute(lanes, 4));
  const traffic = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 }, uSpan: { value: span } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uScale; uniform float uSpan;
      attribute vec4 aLane; // axis, lane position, start, speed
      varying vec3 vColor;
      void main() {
        float along = mod(aLane.z + aLane.w * uTime, uSpan * 2.0) - uSpan;
        vec3 p = aLane.x < 0.5 ? vec3(along, 1.0, aLane.y) : vec3(aLane.y, 1.0, along);
        // No driving across the plaza or the cathedral forecourt
        float hidden = step(length(vec2(p.x / ${PLAZA_STRETCH.toFixed(2)}, p.z)), ${(PLAZA + 6).toFixed(1)});
        hidden = max(hidden, step(abs(p.x), 72.0) * step(0.0, p.z) * step(p.z, 292.0));
        vColor = aLane.w > 0.0 ? vec3(1.0, 0.95, 0.8) : vec3(1.0, 0.16, 0.12);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 - hidden) * max(1.6, uScale * 1.5 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d));
      }`,
  });
  const trafficPoints = new THREE.Points(carGeometry, traffic);
  trafficPoints.frustumCulled = false;
  scene.add(trafficPoints);

  // Four neon spires on the outer corners of the plaza
  const neon = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sz], index) =>
    buildNeonSpire(scene, kit, new THREE.Vector3(sx * 155, 0, sz * 130), new THREE.Vector2(sx, sz), index));

  const color = new THREE.Color();
  return (time: number, excite: number, pointScale: number) => {
    traffic.uniforms.uTime.value = time;
    traffic.uniforms.uScale.value = pointScale;
    beaconMaterial.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2.2));
    for (const spire of neon) {
      color.copy(NEON);
      // A slow pulse (under 1 Hz, so it never strobes hard); the goal pushes it to full
      const level = Math.min(1, 0.55 + 0.45 * Math.sin(time * 4.4 + spire.phase * Math.PI * 2) + excite * 0.5);
      spire.light.color.copy(color);
      spire.light.intensity = 2600 * level;
      spire.tubes.color.copy(color).multiplyScalar(0.6 + 0.4 * level);
      const halo = spire.halo.material as THREE.SpriteMaterial;
      halo.color.copy(color);
      halo.opacity = 0.25 + 0.35 * level;
      const beam = spire.beam.material as THREE.MeshBasicMaterial;
      beam.color.copy(color);
      beam.opacity = 0.02 + 0.035 * level;
      spire.beam.rotation.set(0.5 + 0.25 * Math.sin(time * 0.31 + spire.phase * 9), time * 0.22 + spire.phase * Math.PI * 2, 0, "YXZ");
    }
  };
}

/** Banks of low mist drifting through the streets, on top of the distance fog. */
function buildMist(scene: THREE.Scene, kit: Kit, count: number) {
  const mist = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const bank = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glow, color: 0x39414f, transparent: true, opacity: 0.018 + Math.random() * 0.026, depthWrite: false, fog: false }));
    const angle = Math.random() * Math.PI * 2;
    const radius = 210 + Math.random() * 500;
    bank.position.set(Math.cos(angle) * radius * PLAZA_STRETCH, 14 + Math.random() * 50, Math.sin(angle) * radius);
    bank.scale.set(260 + Math.random() * 300, 70 + Math.random() * 80, 1);
    mist.add(bank);
  }
  scene.add(mist);
  return mist;
}

/** Rain as short streaks falling through a box around the stadium, wrapped in the vertex shader. */
function buildRain(scene: THREE.Scene, count: number) {
  const positions = new Float32Array(count * 6);
  const tails = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 900;
    const y = Math.random() * 300;
    const z = (Math.random() - 0.5) * 900;
    positions.set([x, y, z, x, y, z], i * 6);
    tails[i * 2 + 1] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aTail", new THREE.BufferAttribute(tails, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime; attribute float aTail;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * 150.0, 300.0) + aTail * 5.0;
        p.x += aTail * 0.9; // a little wind
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `void main() { gl_FragColor = vec4(0.75, 0.82, 0.95, 0.16); }`,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.frustumCulled = false;
  scene.add(rain);
  return material;
}

function buildPitch(group: THREE.Group) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? "#0a2d1e" : "#082518";
    ctx.fillRect(i * 32, 0, 32, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const turf = new THREE.Mesh(new THREE.PlaneGeometry(HALF_LENGTH * 2 + 14, HALF_WIDTH * 2 + 14), new THREE.MeshBasicMaterial({ map: texture }));
  turf.rotation.x = -Math.PI / 2;
  group.add(turf);

  const lines = createPitchLines(HALF_LENGTH * 2, HALF_WIDTH * 2, 0xf2f4f8, 0.9);
  lines.position.y = 0.06;
  group.add(lines);

  // LED boards around the touchline
  const boards = new THREE.CatmullRomCurve3(Array.from({ length: 96 }, (_, i) => ring((i / 96) * Math.PI * 2, 6.4, 0.7)), true);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(boards, 300, 0.55, 4, true), new THREE.MeshBasicMaterial({ color: 0x7d0f2a })));

  // Goal frames
  const goal: number[] = [];
  for (const side of [-1, 1]) {
    const x = side * HALF_LENGTH;
    const back = x + side * 2.4;
    for (const z of [-3.66, 3.66]) goal.push(x, 0, z, x, 2.6, z, x, 2.6, z, back, 2.6, z, back, 2.6, z, back, 0, z);
    goal.push(x, 2.6, -3.66, x, 2.6, 3.66, back, 2.6, -3.66, back, 2.6, 3.66);
  }
  const goalGeometry = new THREE.BufferGeometry();
  goalGeometry.setAttribute("position", new THREE.Float32BufferAttribute(goal, 3));
  group.add(new THREE.LineSegments(goalGeometry, new THREE.LineBasicMaterial({ color: 0xffffff })));
}

/* ---------- Crowd ---------- */

function buildCrowd(group: THREE.Group, count: number) {
  const thetas = evenThetas(1440, STAND_START + (ROWS * ROW_DEPTH) / 2);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const palette = [new THREE.Color(0x30333f), new THREE.Color(0x4a4e5c), new THREE.Color(0xc21a40), new THREE.Color(0xaeb3c2), new THREE.Color(0x23252e)];
  for (let i = 0; i < count; i++) {
    // Leave radial stairways and the walkway between the tiers empty
    let slot = 0;
    do slot = Math.floor(Math.random() * thetas.length); while (slot % 45 < 2);
    const theta = thetas[slot] + (Math.random() - 0.5) * 0.004;
    let row = 0;
    do row = Math.random() * (ROWS - 0.5); while (row > TIER_GAP[0] && row < TIER_GAP[1]);
    const p = ring(theta, STAND_START + 0.4 + row * ROW_DEPTH, 1.5 + row * ROW_RISE);
    positions.set([p.x, p.y, p.z], i * 3);
    // Home end leans crimson, away end silver, neutrals in between
    const lean = p.x > 20 ? 2 : p.x < -20 ? 3 : Math.random() < 0.5 ? 2 : 3;
    const c = Math.random() < 0.38 ? palette[lean] : palette[[0, 1, 4][Math.floor(Math.random() * 3)]];
    colors.set([c.r, c.g, c.b], i * 3);
    phases[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uExcite: { value: 0 }, uScale: { value: 600 }, uEnd: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uExcite; uniform float uScale; uniform float uEnd;
      attribute vec3 aColor; attribute float aPhase;
      varying vec3 vColor;
      void main() {
        vec3 p = position;
        float sway = sin(uTime * 2.0 + aPhase * 6.283);
        float jump = max(0.0, sin(uTime * (5.0 + aPhase * 3.0) + aPhase * 40.0));
        // uEnd: 0 = the whole ground, +1 = only the home end (x > 0), -1 = only the away end
        float excite = uExcite * (uEnd == 0.0 ? 1.0 : smoothstep(-12.0, 28.0, position.x * uEnd));
        p.y += sway * 0.12 + excite * jump * 1.8;
        // Camera flashes pop at random around the bowl
        float flash = step(0.9985 - excite * 0.01, fract(sin(aPhase * 91.7 + floor(uTime * 9.0) * 12.9898) * 43758.5453));
        vColor = aColor * (0.8 + 0.2 * sway + excite * 0.9) + flash * 2.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * (1.0 + flash * 1.6) / -mv.z;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0); }`,
  });
  group.add(new THREE.Points(geometry, material));
  return material;
}

/* ---------- Fire ---------- */

/**
 * Jets of flame roaring out of the spire tips when a goal goes in. Each jet is
 * a looping fountain of point sprites; `uPower` fades the whole lot in and out.
 */
function buildFire(group: THREE.Group, tips: THREE.Vector3[], perJet: number) {
  const count = tips.length * perJet;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  tips.forEach((tip, j) => {
    for (let i = 0; i < perJet; i++) {
      const k = j * perJet + i;
      positions.set([tip.x, tip.y, tip.z], k * 3);
      seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], k * 4);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uScale: { value: 600 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPower; uniform float uScale;
      attribute vec4 aSeed;
      varying float vLife; varying float vAlpha;
      void main() {
        float life = 1.5 + aSeed.x * 0.9;
        float age = mod(uTime + aSeed.y * life, life);
        float u = age / life;
        // Straight up out of the spire, fanning out and slowing as it climbs
        vec3 dir = normalize(vec3((aSeed.z - 0.5) * 0.26, 1.0, (aSeed.w - 0.5) * 0.26));
        float speed = (46.0 + aSeed.x * 38.0) * (0.55 + 0.45 * uPower);
        vec3 p = position + dir * speed * age * (1.0 - 0.38 * u);
        p.x += sin(age * 6.0 + aSeed.y * 30.0) * 1.1 * u;
        p.z += cos(age * 5.0 + aSeed.z * 30.0) * 1.1 * u;
        vLife = u;
        vAlpha = uPower * smoothstep(0.0, 0.06, u) * (1.0 - u);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = step(0.002, uPower) * uScale * (2.6 + 4.2 * u) / -mv.z;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.05, d);
        // White-hot at the nozzle, through yellow and orange, to deep red smoke
        vec3 color = mix(vec3(1.0, 0.96, 0.78), vec3(1.0, 0.62, 0.1), smoothstep(0.0, 0.22, vLife));
        color = mix(color, vec3(1.0, 0.25, 0.03), smoothstep(0.2, 0.55, vLife));
        color = mix(color, vec3(0.45, 0.03, 0.02), smoothstep(0.55, 1.0, vLife));
        gl_FragColor = vec4(color, vAlpha * soft);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // flames travel far from the tips
  group.add(points);
  return material;
}

/* ---------- The match ---------- */

const LOOP = 28;
const GOAL_AT = 16;
const RESET_AT = 24;

const HOME_SHAPE: XZ[] = [
  [-48, 0],
  [-32, -22], [-34, -7], [-34, 7], [-32, 22],
  [-12, -14], [-16, 0], [-12, 14],
  [8, -22], [12, 0], [8, 22],
];

interface Step { t: number; pos: XZ; player: number; lofted?: boolean }
interface Move {
  /** 1 = the home side in crimson, -1 = the visitors in silver. */
  team: 1 | -1;
  scores: boolean;
  /** Who has the ball where and when, written as if attacking towards +x; mirrored for the visitors. */
  steps: Step[];
}

const GOAL_LINE = HALF_LENGTH + 1.4;

/** The passages of play, shown one after another: each lasts one LOOP and ends with a shot at GOAL_AT. */
const MOVES: Move[] = [
  // Down the left, cut back, tapped in
  { team: 1, scores: true, steps: [
    { t: 0, pos: [0, 0], player: 9 },
    { t: 1.8, pos: [-11, 3], player: 6 },
    { t: 4.6, pos: [-3, -19], player: 5, lofted: true },
    { t: 7.8, pos: [21, -27], player: 8, lofted: true },
    { t: 11.6, pos: [38, -17], player: 8 },
    { t: 13.6, pos: [41, 5], player: 9 },
    { t: 14.6, pos: [43, 4], player: 9 },
    { t: GOAL_AT, pos: [GOAL_LINE, -1.6], player: -1, lofted: true },
  ] },
  // The visitors break through the middle and score
  { team: -1, scores: true, steps: [
    { t: 0, pos: [0, 0], player: 9 },
    { t: 1.6, pos: [-9, -4], player: 6 },
    { t: 4.2, pos: [2, 16], player: 7, lofted: true },
    { t: 7.4, pos: [24, 24], player: 10, lofted: true },
    { t: 10.8, pos: [37, 12], player: 10 },
    { t: 12.6, pos: [40, -4], player: 9 },
    { t: 13.8, pos: [42, -3], player: 9 },
    { t: GOAL_AT, pos: [GOAL_LINE, 2.1], player: -1, lofted: true },
  ] },
  // Patient build-up, a shot from the edge of the box, and the keeper holds it
  { team: 1, scores: false, steps: [
    { t: 0, pos: [0, 0], player: 9 },
    { t: 2, pos: [-12, -2], player: 6 },
    { t: 5, pos: [-2, 18], player: 7 },
    { t: 8.5, pos: [20, 10], player: 10, lofted: true },
    { t: 11.5, pos: [30, -4], player: 9 },
    { t: 13.4, pos: [33, -2], player: 9 },
    { t: 15, pos: [HALF_LENGTH - 2.5, 1.2], player: -1 },
    { t: GOAL_AT, pos: [HALF_LENGTH - 2.5, 1.2], player: -1 },
  ] },
  // Worked across midfield, then a strike from distance into the corner
  { team: 1, scores: true, steps: [
    { t: 0, pos: [0, 0], player: 9 },
    { t: 1.8, pos: [-10, -3], player: 6 },
    { t: 4.4, pos: [-6, -20], player: 5 },
    { t: 7.2, pos: [8, -10], player: 6 },
    { t: 10.4, pos: [19, 2], player: 6 },
    { t: 12.6, pos: [26, 6], player: 7 },
    { t: 14.3, pos: [28, 5], player: 7 },
    { t: GOAL_AT, pos: [GOAL_LINE, -2.9], player: -1, lofted: true },
  ] },
];
const CELEBRATION: XZ = [46, -29];

const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Ball position in the attacking team's own frame (always attacking +x). */
function ballAt(t: number, steps: Step[]): { x: number; z: number; y: number; owner: number } {
  const [endX, endZ] = steps[steps.length - 1].pos;
  if (t >= RESET_AT) {
    // Carried back to the centre spot for the restart
    const u = smooth(clamp01((t - RESET_AT) / (LOOP - RESET_AT - 0.8)));
    return { x: endX * (1 - u), z: endZ * (1 - u), y: 0.7, owner: -1 };
  }
  if (t >= GOAL_AT) return { x: endX, z: endZ, y: 0.7, owner: -1 };
  let i = 0;
  while (i < steps.length - 2 && steps[i + 1].t <= t) i++;
  const from = steps[i];
  const to = steps[i + 1];
  const u = clamp01((t - from.t) / (to.t - from.t));
  const dribble = from.player === to.player && from.player >= 0;
  const e = dribble ? u : smooth(u);
  return {
    x: from.pos[0] + (to.pos[0] - from.pos[0]) * e,
    z: from.pos[1] + (to.pos[1] - from.pos[1]) * e,
    y: 0.7 + (to.lofted ? Math.sin(Math.PI * u) * 5 : 0),
    owner: dribble ? from.player : -1,
  };
}

function buildMatch(group: THREE.Group) {
  const body = new THREE.CapsuleGeometry(0.85, 1.9, 3, 8);
  const players = new THREE.InstancedMesh(body, new THREE.MeshBasicMaterial(), 22);
  const crimson = new THREE.Color(0xff2d55);
  const silver = new THREE.Color(0xeef1f7);
  const keeper = new THREE.Color(0xf5b301);
  for (let i = 0; i < 22; i++) players.setColorAt(i, i % 11 === 0 ? keeper : i < 11 ? crimson : silver);
  players.instanceColor!.needsUpdate = true;
  players.frustumCulled = false;
  group.add(players);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  group.add(ball);

  const current = Array.from({ length: 22 }, (_, i) => {
    const [x, z] = HOME_SHAPE[i % 11];
    return new THREE.Vector2(i < 11 ? x : -x, z);
  });
  const target = new THREE.Vector2();
  const aim = new THREE.Vector2();
  const m = new THREE.Matrix4();

  /** Advances the match; returns the time within the current passage and who (if anyone) scores in it. */
  return (time: number, delta: number): { t: number; scorer: 1 | -1 | 0 } => {
    const move = MOVES[Math.floor(time / LOOP) % MOVES.length];
    const t = time % LOOP;
    const dir = move.team; // world x direction the attackers are heading
    const local = ballAt(t, move.steps);
    const bx = local.x * dir;
    const bz = local.z;
    ball.position.set(bx, local.y, bz);
    const scored = move.scores;
    const celebrating = scored ? smooth(clamp01((t - GOAL_AT - 0.3) / 1.6)) * (1 - smooth(clamp01((t - RESET_AT) / 2.5))) : 0;
    const shotAt = move.steps[move.steps.length - 2].t;
    const shotZ = move.steps[move.steps.length - 1].pos[1];

    // The defender best placed to close the ball down
    let presser = -1;
    let nearest = Infinity;
    for (let i = 0; i < 22; i++) {
      const side = i < 11 ? 1 : -1;
      if (side === dir || i % 11 === 0) continue;
      const d = (current[i].x - bx) ** 2 + (current[i].y - bz) ** 2;
      if (d < nearest) { nearest = d; presser = i; }
    }

    for (let i = 0; i < 22; i++) {
      const slot = i % 11;
      const side = i < 11 ? 1 : -1;
      const [hx, hz] = HOME_SHAPE[slot];
      // The whole shape slides with the ball; keepers barely move
      target.set(side * hx + bx * (slot === 0 ? 0.05 : 0.45), hz + bz * (slot === 0 ? 0.12 : 0.18));

      if (side === dir) {
        // Attackers run onto the next pass, or carry the ball
        let pull = 0;
        let px = 0;
        let pz = 0;
        for (const step of move.steps) {
          if (step.player !== slot) continue;
          const w = 1 - clamp01((Math.abs(t - step.t) - 0.4) / 2.6);
          if (w > pull) { pull = w; px = step.pos[0] * dir; pz = step.pos[1]; }
        }
        if (local.owner === slot) { pull = 1; px = bx - 0.9 * dir; pz = bz; }
        if (t < GOAL_AT + 0.3) target.lerp(aim.set(px, pz), smooth(pull));
        if (slot !== 0) {
          const angle = (slot / 10) * Math.PI * 2 + t * 1.5;
          target.lerp(aim.set(CELEBRATION[0] * dir + Math.cos(angle) * 3.5, CELEBRATION[1] + Math.sin(angle) * 3.5), celebrating);
        }
      } else if (i === presser && t < GOAL_AT) {
        target.lerp(aim.set(bx + 1.5 * dir, bz), 0.7);
      } else if (slot === 0 && t > shotAt && t < RESET_AT) {
        // Beaten keepers go the wrong way; a save means getting across to the ball
        target.set(side * hx, scored ? -Math.sign(shotZ) * 4.5 : shotZ);
      }

      current[i].lerp(target, 1 - Math.exp(-delta * 2.6));
      const speed = current[i].distanceTo(target);
      const hop = Math.abs(Math.sin(t * 9 + i)) * Math.min(0.5, speed * 0.15) + (side === dir && slot !== 0 ? celebrating * Math.abs(Math.sin(t * 7 + i)) * 1.2 : 0);
      m.makeTranslation(current[i].x, 1.8 + hop, current[i].y);
      players.setMatrixAt(i, m);
    }
    players.instanceMatrix.needsUpdate = true;
    return { t, scorer: scored ? dir : 0 };
  };
}

/* ---------- Scene ---------- */

const EMBER = 700;

export function setupStadium({ scene, camera, renderer, pointer }: Stage) {
  const small = window.innerWidth < 768;
  // Wet night air: a blue-grey murk that swallows the far city
  const haze = new THREE.Color(0x0c0f15);
  scene.fog = new THREE.FogExp2(haze, small ? 0.0023 : 0.0021);
  scene.background = haze;

  const kit = makeKit();
  const stadium = new THREE.Group();
  scene.add(stadium);

  buildPitch(stadium);
  buildBowl(stadium, kit);
  buildArcade(stadium, kit);
  const spireTips = buildTowers(stadium, kit);
  buildPortals(stadium, kit);
  const cathedral = buildCathedral(stadium, kit);
  spireTips.push(...cathedral.tips);
  const beams = buildFloodlights(stadium, kit);
  const crowd = buildCrowd(stadium, small ? 9000 : 20000);
  const fire = buildFire(stadium, spireTips, small ? 160 : 420);
  const playMatch = buildMatch(stadium);
  const pulseCity = buildCity(scene, kit, small);
  const rain = buildRain(scene, small ? 2500 : 7000);
  const mist = buildMist(scene, kit, small ? 24 : 60);

  // The bowl glows red from within, and the glow hangs in the mist above it
  const bowlGlow = glowSprite(kit, BLOOD, 330, 0.3);
  bowlGlow.position.set(0, 34, 0);
  scene.add(bowlGlow);
  const embers: THREE.PointLight[] = [];
  for (const x of small ? [0] : [-34, 34]) {
    const ember = new THREE.PointLight(BLOOD, EMBER, 260, 1.3);
    ember.position.set(x, 26, 0);
    scene.add(ember);
    embers.push(ember);
  }
  // Red light spilling from each doorway onto the wet plaza
  if (!small) {
    for (const [x, z] of [[WALL_OFFSET + HALF_LENGTH + 34, 0], [-(WALL_OFFSET + HALF_LENGTH + 34), 0], [0, -(WALL_OFFSET + HALF_WIDTH + 34)], [0, WALL_OFFSET + HALF_WIDTH + NAVE_LENGTH + 22]]) {
      const spill = new THREE.PointLight(BLOOD, 420, 130, 1.4);
      spill.position.set(x, 9, z);
      scene.add(spill);
    }
  }

  scene.add(new THREE.HemisphereLight(0x8e9bb8, 0x0a0a10, 0.75));
  const moon = new THREE.DirectionalLight(0xcfd9ff, 1.25);
  moon.position.set(-120, 180, 90);
  scene.add(moon);
  // Firelight on the stone while the spires burn
  const flare = new THREE.PointLight(0xff7a1a, 0, 520, 1.2);
  flare.position.set(0, 120, 0);
  scene.add(flare);

  return (time: number, delta: number) => {
    const { t, scorer } = playMatch(time, delta);

    // Crowd: a murmur that rises as the chance develops. A home goal lifts the
    // whole ground, an away goal only the visitors' end, a save draws a groan.
    const sinceGoal = t - GOAL_AT;
    const settle = 1 - smooth(clamp01((t - RESET_AT) / 3)) * 0.8;
    const excite = sinceGoal < 0
      ? 0.05 + 0.3 * smooth(clamp01((t - 11.5) / 4.5))
      : scorer === 0
        ? Math.max(0.06, 0.3 * Math.exp(-sinceGoal * 0.9))
        : Math.max(0.08, Math.exp(-sinceGoal * 0.22)) * settle;
    const homeJoy = scorer === 1 && sinceGoal >= 0 ? excite : sinceGoal < 0 ? excite : 0.06;
    crowd.uniforms.uEnd.value = sinceGoal >= 0 && scorer === -1 ? -1 : 0;
    const pointScale = renderer.domElement.height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    crowd.uniforms.uTime.value = time;
    crowd.uniforms.uExcite.value = excite;
    crowd.uniforms.uScale.value = pointScale;
    // The spires catch fire at the goal, burn hard for a few seconds, then gutter out
    // Only for a home goal: nobody lights the cathedral for the visitors
    const burn = sinceGoal < 0 || scorer !== 1 ? 0 : Math.min(1, sinceGoal * 3) * Math.exp(-Math.max(0, sinceGoal - 4.5) * 0.9);
    fire.uniforms.uTime.value = time;
    fire.uniforms.uPower.value = burn < 0.004 ? 0 : burn;
    fire.uniforms.uScale.value = pointScale;
    rain.uniforms.uTime.value = time;
    // Steady light in the cathedral windows; they only flare for a home goal
    kit.glass.uniforms.uGlow.value = 0.45 + 0.55 * (scorer === 1 && sinceGoal >= 0 ? excite : 0);
    beams.opacity = 0.055 + homeJoy * 0.06;
    (bowlGlow.material as THREE.SpriteMaterial).opacity = 0.26 + homeJoy * 0.3;
    for (const ember of embers) ember.intensity = EMBER * (0.8 + homeJoy * 1.2);
    flare.intensity = 2600 * burn * (0.75 + 0.25 * Math.sin(time * 19));
    pulseCity(time, homeJoy, pointScale);
    cathedral.turnRelic(time, scorer === 1 && sinceGoal >= 0 ? excite : 0);
    mist.rotation.y = time * 0.006;

    // The blimp: one slow lap every ~100 seconds
    // It starts opposite the cathedral, and climbs as it passes behind the great tower
    const angle = time * 0.062 - 1.9;
    const lift = Math.max(0, Math.sin(angle)) ** 2;
    const radius = 315 + Math.sin(time * 0.05) * 16 + lift * 60;
    camera.position.set(Math.cos(angle) * radius + pointer.x * 8, 192 + Math.sin(time * 0.08) * 12 + pointer.y * 5 + lift * 80, Math.sin(angle) * radius * 0.86);
    // Aimed well above the pitch so the great tower and the relic on it stay in frame all the way round
    camera.lookAt(0, 60, 0);
  };
}
