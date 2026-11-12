import * as THREE from "three";
import { BLOOD, CHROME, type Stage } from "./stage";
import { createPitchLines } from "./models";

/**
 * A gothic cathedral stadium on a rainy night, seen from a circling blimp:
 * a stone bowl with a lancet arcade and flying buttresses, a nave and great
 * tower grown out of one stand, a low-resolution city with neon corners, a
 * crowd of point sprites, and a 28-second match loop that ends in a goal
 * and fireworks.
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

/** City block facade: dark wall with a few lit windows, used as both colour and emissive map. */
function makeWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#101116";
  ctx.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 8; col++) {
      const roll = Math.random();
      ctx.fillStyle = roll < 0.1 ? "#ffd9a0" : roll < 0.15 ? "#ff2d55" : roll < 0.17 ? "#3de0ff" : "#07080b";
      ctx.fillRect(col * 8 + 2, row * 8 + 2, 4, 5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
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

interface Kit {
  /** Stone with the block texture tiled `u` by `v` times across each face. */
  stone: (u: number, v: number, tint?: number) => THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  /** Stained glass, lit from inside. */
  glass: THREE.MeshBasicMaterial;
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
    glass: new THREE.MeshBasicMaterial({ color: BLOOD, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
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
  const rails: [number, number, number][] = [
    [WALL_OFFSET, WALL_HEIGHT, 0.5],
    [WALL_OFFSET - CANOPY_REACH, WALL_HEIGHT + CANOPY_RISE, 0.35],
    [STAND_START - 0.6, 1.2, 0.18],
    [concourse, 1.4 + TIER_GAP[0] * ROW_RISE, 0.22],
  ];
  for (const [offset, y, radius] of rails) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 120 }, (_, i) => ring((i / 120) * Math.PI * 2, offset, y)), true);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 360, radius, 6, true), kit.chrome));
  }
}

function buildArcade(group: THREE.Group, kit: Kit) {
  const bays = 76;
  const thetas = evenThetas(bays, WALL_OFFSET);
  const windowShape = lancet(6.2, 22);
  const hole = lancet(4.6, 20.4);
  windowShape.holes.push(new THREE.Path(hole.getPoints(12).map((p) => new THREE.Vector2(p.x, p.y + 0.8))));
  const frameGeometry = new THREE.ExtrudeGeometry(windowShape, { depth: 0.9, bevelEnabled: false, curveSegments: 10 });
  const paneGeometry = new THREE.ShapeGeometry(lancet(4.8, 21), 10);

  const dressed = new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.85, metalness: 0.08, envMapIntensity: 0.2 });
  const pierStone = kit.stone(0.4, 5);
  const frames = new THREE.InstancedMesh(frameGeometry, dressed, bays * 2);
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

  // Window tracery: a mullion and an oculus in the head of each tall window
  const mullions = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 14, 0.5), dressed, bays);
  const oculi = new THREE.InstancedMesh(new THREE.TorusGeometry(1.25, 0.2, 6, 20), dressed, bays);

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
  const ribs = new THREE.InstancedMesh(new THREE.TubeGeometry(ribCurve, 12, 0.24, 5), kit.chrome, bays);

  const step = (Math.PI * 2) / bays;
  thetas.forEach((theta, i) => {
    // Tall clerestory window above a smaller arcade arch
    frames.setMatrixAt(i * 2, place(theta, 0.1, 16, 1));
    panes.setMatrixAt(i * 2, place(theta, 0.3, 16.4, 1));
    frames.setMatrixAt(i * 2 + 1, place(theta, 0.1, 1, 0.55));
    panes.setMatrixAt(i * 2 + 1, place(theta, 0.3, 1.2, 0.55));
    mullions.setMatrixAt(i, place(theta, 0.5, 16.8 + 7, 1));
    oculi.setMatrixAt(i, place(theta, 0.5, 16 + 16.2, 1));
    const between = theta + step / 2;
    piers.setMatrixAt(i, place(between, 1.4, (WALL_HEIGHT + 4) / 2, 1));
    pinnacles.setMatrixAt(i, place(between, 1.4, WALL_HEIGHT + 9.5, 1));

    outerPiers.setMatrixAt(i, place(between, FLY_OUT, 15, 1));
    outerPinnacles.setMatrixAt(i, place(between, FLY_OUT, 34.5, 1));
    flyers.setMatrixAt(i, place(between, 1.4 + flyerRun / 2, 27 + flyerRise / 2, 1, Math.atan2(flyerRise, flyerRun)));
    if (i % 2 === 0) crosses.setMatrixAt(i / 2, place(between, FLY_OUT, 38.6, 1));
    ribs.setMatrixAt(i, place(between, 0, WALL_HEIGHT, 1));
  });
  group.add(frames, panes, piers, pinnacles, mullions, oculi, outerPiers, outerPinnacles, flyers, crosses, ribs);
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

function buildTowers(group: THREE.Group, kit: Kit) {
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
    const spire = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, height * 0.75, 8), kit.slate);
    spire.position.y = height + height * 0.375;
    spire.rotation.y = Math.PI / 8;
    const cross = new THREE.Mesh(crossGeometry(width * 0.75), kit.chrome);
    cross.position.y = height * 1.75 - 1;
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
      const slit = new THREE.Mesh(new THREE.ShapeGeometry(lancet(width * 0.22, height * 0.2), 8), kit.glass);
      slit.position.y = height * 0.72;
      slit.rotation.y = (face * Math.PI) / 2;
      slit.translateZ(width / 2 + 0.05);
      tower.add(slit);
    }
    if (tall) {
      const rose = roseWindow(width * 0.32, kit.glass, kit.chrome, 8);
      rose.position.set(0, height * 0.48, width / 2 + 0.2);
      tower.add(rose);
    }
    group.add(tower);
  });
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
  const rose = roseWindow(8.5, kit.glass, kit.chrome, 12);
  rose.position.set(0, 40, 4.15);
  portal.add(rose);

  const doorFrame = lancet(11, 24);
  doorFrame.holes.push(new THREE.Path(lancet(8.6, 22).getPoints(12)));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(doorFrame, { depth: 1.2, bevelEnabled: false, curveSegments: 10 }), kit.chrome);
  frame.position.z = 4;
  const door = new THREE.Mesh(new THREE.ShapeGeometry(lancet(8.8, 22.4), 10), kit.glass);
  door.position.set(0, 0.2, 4.1);
  portal.add(door, frame);

  for (const side of [-1, 1]) {
    const niche = new THREE.Mesh(new THREE.ShapeGeometry(lancet(3, 12), 8), kit.glass);
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

const NAVE_LENGTH = 58;
const GREAT_TOWER_HEIGHT = 132;

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
      const aisleWindow = new THREE.Mesh(new THREE.ShapeGeometry(lancet(4.6, 18), 8), kit.glass);
      aisleWindow.position.set(x, 5, z);
      aisleWindow.rotation.y = (side * Math.PI) / 2;
      const clerestory = new THREE.Mesh(new THREE.ShapeGeometry(lancet(3.6, 12), 8), kit.glass);
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
  for (const level of [0.42, 0.62, 0.84, 1]) {
    const course = new THREE.Mesh(new THREE.BoxGeometry(width + 1.6, 1.4, width + 1.6), kit.slate);
    course.position.y = GREAT_TOWER_HEIGHT * level;
    tower.add(course);
  }
  const turretStone = kit.stone(1, 13);
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, GREAT_TOWER_HEIGHT + 6, 8), turretStone);
    turret.position.set((dx * width) / 2, (GREAT_TOWER_HEIGHT + 6) / 2, (dz * width) / 2);
    const spirelet = new THREE.Mesh(new THREE.ConeGeometry(3.2, 30, 8), kit.slate);
    spirelet.position.set((dx * width) / 2, GREAT_TOWER_HEIGHT + 21, (dz * width) / 2);
    const finial = new THREE.Mesh(crossGeometry(4.5), kit.chrome);
    finial.position.set((dx * width) / 2, GREAT_TOWER_HEIGHT + 35, (dz * width) / 2);
    tower.add(turret, spirelet, finial);
  }
  for (let face = 0; face < 4; face++) {
    const side = new THREE.Group();
    side.rotation.y = (face * Math.PI) / 2;
    // Paired belfry lancets, a lower pair below, and small pinnacles along the parapet
    for (const x of [-6, 6]) {
      const belfry = new THREE.Mesh(new THREE.ShapeGeometry(lancet(6, 34), 10), kit.glass);
      belfry.position.set(x, GREAT_TOWER_HEIGHT * 0.66, width / 2 + 0.1);
      const lower = new THREE.Mesh(new THREE.ShapeGeometry(lancet(4.4, 20), 10), kit.glass);
      lower.position.set(x, GREAT_TOWER_HEIGHT * 0.44, width / 2 + 0.1);
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 30, 0.6), kit.slate);
      mullion.position.set(x, GREAT_TOWER_HEIGHT * 0.66 + 14, width / 2 + 0.3);
      side.add(belfry, lower, mullion);
    }
    for (const x of [-8, 0, 8]) {
      const merlon = new THREE.Mesh(new THREE.ConeGeometry(1.3, 13, 4), kit.slate);
      merlon.position.set(x, GREAT_TOWER_HEIGHT + 6.5, width / 2);
      side.add(merlon);
    }
    tower.add(side);
  }
  addGargoyles(tower, width, GREAT_TOWER_HEIGHT * 0.62, kit.slate);
  addGargoyles(tower, width, GREAT_TOWER_HEIGHT * 0.84, kit.slate);
  cathedral.add(tower);
  group.add(cathedral);
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
  const thetas = evenThetas(16, WALL_OFFSET);
  for (const k of [1, 5, 9, 13]) {
    const theta = thetas[k] + 0.06;
    const n = outwardNormal(theta, WALL_OFFSET);
    const foot = ring(theta, WALL_OFFSET, WALL_HEIGHT);
    const top = foot.clone().setY(WALL_HEIGHT + 38);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.3, 38, 1.3), steel);
    mast.position.copy(foot).setY(WALL_HEIGHT + 19);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(13, 7, 1), head);
    panel.position.copy(top);
    panel.rotation.y = Math.atan2(n.x, n.z);
    panel.rotateX(0.5);
    const halo = glowSprite(kit, 0xd5e4ff, 95, 0.75);
    halo.position.copy(top).addScaledVector(n, -2);

    const target = new THREE.Vector3(Math.sign(foot.x) * 20, 0, Math.sign(foot.z) * 12);
    const span = target.clone().sub(top);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2, 30, span.length(), 20, 1, true), beam);
    shaft.position.copy(top).addScaledVector(span, 0.5);
    shaft.quaternion.setFromUnitVectors(upAxis, span.clone().negate().normalize());
    group.add(mast, panel, halo, shaft);
  }
  return beam;
}

/* ---------- City ---------- */

const NEON = [0xff2bd6, 0x18e0ff, 0x7a3cff, 0x9dff3c].map((hex) => new THREE.Color(hex));

interface NeonCorner {
  light: THREE.PointLight;
  tubes: THREE.MeshBasicMaterial;
  halo: THREE.Sprite;
  beam: THREE.Mesh;
  phase: number;
}

/**
 * A low-resolution city: a few hundred instanced blocks on a street grid with
 * lit windows and street lamps, and four neon towers whose light washes over
 * whatever is near them.
 */
function buildCity(scene: THREE.Scene, kit: Kit, small: boolean) {
  const facade = makeWindowTexture();
  const walls = new THREE.MeshLambertMaterial({ map: facade, emissiveMap: facade, emissive: 0xffffff, emissiveIntensity: 0.9 });
  const roofs = new THREE.MeshLambertMaterial({ color: 0x0b0c10 });
  const sides = [walls, walls, roofs, roofs, walls, walls];

  const cell = 62;
  const reach = small ? 7 : 11;
  const blocks: THREE.Matrix4[] = [];
  const lamps: number[] = [];
  const lampColors: number[] = [];
  const m = new THREE.Matrix4();
  const warm = new THREE.Color(0xffc98a);
  const red = new THREE.Color(0xff2d55);
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const cx = i * cell;
      const cz = j * cell;
      // Keep the plaza and the cathedral's forecourt clear
      const clear = Math.hypot(cx / 1.15, cz) < 215 || (Math.abs(cx) < 70 && cz > 0 && cz < 290);
      if (clear) continue;
      const lots = Math.random() < 0.55 ? 2 : 1;
      for (let lot = 0; lot < lots; lot++) {
        const w = lots === 2 ? 20 + Math.random() * 6 : 30 + Math.random() * 16;
        const d = 26 + Math.random() * 18;
        const h = Math.random() < 0.06 ? 70 + Math.random() * 60 : 9 + Math.random() ** 2 * 44;
        const x = cx + (lots === 2 ? (lot - 0.5) * 26 : 0) + (Math.random() - 0.5) * 4;
        blocks.push(m.compose(new THREE.Vector3(x, h / 2, cz + (Math.random() - 0.5) * 6), new THREE.Quaternion(), new THREE.Vector3(w, h, d)).clone());
      }
      const lamp = Math.random() < 0.25 ? red : warm;
      lamps.push(cx + cell / 2, 4, cz + cell / 2);
      lampColors.push(lamp.r, lamp.g, lamp.b);
    }
  }
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sides, blocks.length);
  blocks.forEach((matrix, i) => city.setMatrixAt(i, matrix));
  scene.add(city);

  const lampGeometry = new THREE.BufferGeometry();
  lampGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lamps, 3));
  lampGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lampColors, 3));
  scene.add(new THREE.Points(lampGeometry, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9 })));

  // Wet streets: a dark, glossy ground that picks up every light near it
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1100, 64), new THREE.MeshStandardMaterial({ color: 0x07080b, metalness: 0.7, roughness: 0.42, envMapIntensity: 0.12 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.4;
  scene.add(ground);

  // Neon towers in four corners of the plaza
  const upAxis = new THREE.Vector3(0, 1, 0);
  const corners: NeonCorner[] = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sz], k) => {
    const height = 78 + k * 8;
    const base = new THREE.Vector3(sx * 178, 0, sz * 152);
    const block = new THREE.Mesh(new THREE.BoxGeometry(24, height, 24), sides);
    block.position.copy(base).setY(height / 2);
    scene.add(block);

    const tubes = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(1.1, height, 1.1), tubes);
      tube.position.set(base.x + dx * 12.4, height / 2, base.z + dz * 12.4);
      scene.add(tube);
    }
    const crown = new THREE.Mesh(new THREE.TorusGeometry(15, 0.7, 6, 4), tubes);
    crown.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    crown.position.copy(base).setY(height + 1);
    scene.add(crown);

    const halo = glowSprite(kit, 0xffffff, 150, 0.5);
    halo.position.copy(base).setY(height * 0.75);
    scene.add(halo);

    // Placed on the stadium side of the tower so the stone and the plaza catch the colour
    const light = new THREE.PointLight(0xffffff, 0, 330, 1.25);
    light.position.set(base.x - sx * 34, 46, base.z - sz * 30);
    scene.add(light);

    // A searchlight sweeping the sky from the roof
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 22, 320, 16, 1, true).translate(0, -160, 0).rotateX(Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    beam.position.copy(base).setY(height);
    beam.quaternion.setFromUnitVectors(upAxis, upAxis);
    scene.add(beam);
    return { light, tubes, halo, beam, phase: k / 4 };
  });

  const color = new THREE.Color();
  return (time: number, excite: number) => {
    for (const corner of corners) {
      // Drift through the palette, each corner a quarter-turn apart
      const position = (time * 0.035 + corner.phase) * NEON.length;
      const from = NEON[Math.floor(position) % NEON.length];
      const to = NEON[(Math.floor(position) + 1) % NEON.length];
      color.lerpColors(from, to, smooth(position % 1));
      // A slow pulse (under 1 Hz, so it never strobes hard); the goal pushes it to full
      const pulse = 0.55 + 0.45 * Math.sin(time * 4.4 + corner.phase * Math.PI * 2);
      const level = Math.min(1, pulse + excite * 0.5);
      corner.light.color.copy(color);
      corner.light.intensity = 2600 * level;
      corner.tubes.color.copy(color).multiplyScalar(0.55 + 0.45 * level);
      (corner.halo.material as THREE.SpriteMaterial).color.copy(color);
      (corner.halo.material as THREE.SpriteMaterial).opacity = 0.25 + 0.4 * level;
      const beamMaterial = corner.beam.material as THREE.MeshBasicMaterial;
      beamMaterial.color.copy(color);
      beamMaterial.opacity = 0.04 + 0.06 * level;
      corner.beam.rotation.set(0.5 + 0.25 * Math.sin(time * 0.31 + corner.phase * 9), time * 0.22 + corner.phase * Math.PI * 2, 0, "YXZ");
    }
  };
}

/** Rain as short streaks falling through a box around the stadium, wrapped in the vertex shader. */
function buildRain(scene: THREE.Scene, count: number) {
  const positions = new Float32Array(count * 6);
  const tails = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 760;
    const y = Math.random() * 300;
    const z = (Math.random() - 0.5) * 760;
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
    ctx.fillStyle = i % 2 ? "#0d3a26" : "#0a2f1f";
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
  group.add(new THREE.Mesh(new THREE.TubeGeometry(boards, 300, 0.55, 4, true), new THREE.MeshBasicMaterial({ color: 0xb3123a })));

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
    uniforms: { uTime: { value: 0 }, uExcite: { value: 0 }, uScale: { value: 600 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uExcite; uniform float uScale;
      attribute vec3 aColor; attribute float aPhase;
      varying vec3 vColor;
      void main() {
        vec3 p = position;
        float sway = sin(uTime * 2.0 + aPhase * 6.283);
        float jump = max(0.0, sin(uTime * (5.0 + aPhase * 3.0) + aPhase * 40.0));
        p.y += sway * 0.12 + uExcite * jump * 1.8;
        // Camera flashes pop at random around the bowl
        float flash = step(0.9985 - uExcite * 0.01, fract(sin(aPhase * 91.7 + floor(uTime * 9.0) * 12.9898) * 43758.5453));
        vColor = aColor * (0.8 + 0.2 * sway + uExcite * 0.9) + flash * 2.5;
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

/* ---------- Fireworks ---------- */

const FIREWORK_LIFE = 2.8;

function buildFireworks(group: THREE.Group, bursts: number, perBurst: number) {
  const count = bursts * perBurst;
  const origins = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const starts = new Float32Array(count);
  const seeds = new Float32Array(count);
  const tints = new Float32Array(count);
  const rim = evenThetas(bursts, WALL_OFFSET);
  for (let b = 0; b < bursts; b++) {
    const origin = ring(rim[(b * 7) % bursts], WALL_OFFSET - 6 - Math.random() * 30, 62 + Math.random() * 46);
    const start = b < 6 ? b * 0.12 : 0.6 + Math.random() * 6.4; // opening salvo, then rolling volleys
    const speed = 20 + Math.random() * 16;
    const tint = Math.random() < 0.3 ? 1 : 0;
    for (let i = 0; i < perBurst; i++) {
      const k = b * perBurst + i;
      const dir = new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.75 + Math.random() * 0.25));
      origins.set([origin.x, origin.y, origin.z], k * 3);
      velocities.set([dir.x, dir.y, dir.z], k * 3);
      starts[k] = start;
      seeds[k] = Math.random();
      tints[k] = tint;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute("aStart", new THREE.BufferAttribute(starts, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uScale: { value: 600 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uT; uniform float uScale;
      attribute vec3 aVelocity; attribute float aStart; attribute float aSeed; attribute float aTint;
      varying float vAlpha; varying float vTint;
      void main() {
        float age = uT - aStart;
        float alive = step(0.0, age) * step(age, ${FIREWORK_LIFE.toFixed(1)});
        // Drag slows the shell, gravity pulls the sparks into a willow
        vec3 p = position + aVelocity * (1.0 - exp(-1.5 * age)) / 1.5 + vec3(0.0, -3.5 * age * age, 0.0);
        float fade = 1.0 - age / ${FIREWORK_LIFE.toFixed(1)};
        vAlpha = alive * fade * (0.55 + 0.45 * sin(age * 34.0 + aSeed * 60.0));
        vTint = aTint;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = alive * uScale * (1.8 + aSeed * 1.9) / -mv.z;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha; varying float vTint;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        vec3 chrome = mix(vec3(0.82, 0.86, 0.95), vec3(1.0), core);
        vec3 blood = mix(vec3(0.88, 0.11, 0.28), vec3(1.0, 0.75, 0.8), core);
        gl_FragColor = vec4(mix(chrome, blood, vTint), vAlpha * core);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // sparks travel far from their origins
  group.add(points);
  return material;
}

/* ---------- The match ---------- */

const LOOP = 28;
const GOAL_AT = 16;
const RESET_AT = 24;

type XZ = [number, number];
const HOME_SHAPE: XZ[] = [
  [-48, 0],
  [-32, -22], [-34, -7], [-34, 7], [-32, 22],
  [-12, -14], [-16, 0], [-12, 14],
  [8, -22], [12, 0], [8, 22],
];

/** The scripted move: who has the ball where, and when. Team A attacks towards +x. */
const MOVE: { t: number; pos: XZ; player: number; lofted?: boolean }[] = [
  { t: 0, pos: [0, 0], player: 9 },
  { t: 1.8, pos: [-11, 3], player: 6 },
  { t: 4.6, pos: [-3, -19], player: 5, lofted: true },
  { t: 7.8, pos: [21, -27], player: 8, lofted: true },
  { t: 11.6, pos: [38, -17], player: 8 },
  { t: 13.6, pos: [41, 5], player: 9 },
  { t: 14.6, pos: [43, 4], player: 9 },
  { t: GOAL_AT, pos: [HALF_LENGTH + 1.4, -1.6], player: -1, lofted: true },
];
const CELEBRATION: XZ = [46, -29];

const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function ballAt(t: number): { x: number; z: number; y: number; owner: number } {
  if (t >= RESET_AT) {
    // Carried back to the centre spot for the restart
    const u = smooth(clamp01((t - RESET_AT) / (LOOP - RESET_AT - 0.8)));
    const [gx, gz] = MOVE[MOVE.length - 1].pos;
    return { x: gx * (1 - u), z: gz * (1 - u), y: 0.7, owner: -1 };
  }
  if (t >= GOAL_AT) {
    const [gx, gz] = MOVE[MOVE.length - 1].pos;
    return { x: gx, z: gz, y: 0.7, owner: -1 };
  }
  let i = 0;
  while (i < MOVE.length - 2 && MOVE[i + 1].t <= t) i++;
  const from = MOVE[i];
  const to = MOVE[i + 1];
  const u = clamp01((t - from.t) / (to.t - from.t));
  const dribble = from.player === to.player;
  const e = dribble ? u : smooth(u);
  const height = to.lofted ? Math.sin(Math.PI * u) * 5 : 0;
  return {
    x: from.pos[0] + (to.pos[0] - from.pos[0]) * e,
    z: from.pos[1] + (to.pos[1] - from.pos[1]) * e,
    y: 0.7 + height,
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
  const m = new THREE.Matrix4();

  return (t: number, delta: number) => {
    const b = ballAt(t);
    ball.position.set(b.x, b.y, b.z);
    const celebrating = smooth(clamp01((t - GOAL_AT - 0.3) / 1.6)) * (1 - smooth(clamp01((t - RESET_AT) / 2.5)));

    // The defender best placed to close the ball down
    let presser = -1;
    let nearest = Infinity;
    for (let i = 12; i < 22; i++) {
      const d = (current[i].x - b.x) ** 2 + (current[i].y - b.z) ** 2;
      if (d < nearest) { nearest = d; presser = i; }
    }

    for (let i = 0; i < 22; i++) {
      const slot = i % 11;
      const side = i < 11 ? 1 : -1;
      const [hx, hz] = HOME_SHAPE[slot];
      // The whole shape slides with the ball; keepers barely move
      const follow = slot === 0 ? 0.05 : 0.45;
      target.set(side * hx + b.x * follow, hz + b.z * (slot === 0 ? 0.12 : 0.18));

      if (side === 1) {
        // Run onto the next pass, or carry the ball
        let pull = 0;
        let px = 0;
        let pz = 0;
        for (const step of MOVE) {
          if (step.player !== slot) continue;
          const w = 1 - clamp01((Math.abs(t - step.t) - 0.4) / 2.6);
          if (w > pull) { pull = w; [px, pz] = step.pos; }
        }
        if (b.owner === slot) { pull = 1; px = b.x - 0.9; pz = b.z; }
        if (t < GOAL_AT + 0.3) target.lerp(new THREE.Vector2(px, pz), smooth(pull));
        if (slot !== 0) {
          const angle = (slot / 10) * Math.PI * 2 + t * 1.5;
          target.lerp(new THREE.Vector2(CELEBRATION[0] + Math.cos(angle) * 3.5, CELEBRATION[1] + Math.sin(angle) * 3.5), celebrating);
        }
      } else if (i === presser && t < GOAL_AT) {
        target.lerp(new THREE.Vector2(b.x + 1.5, b.z), 0.7);
      } else if (slot === 0 && t > 14.6 && t < RESET_AT) {
        target.set(side * hx, 4.5); // the keeper goes the wrong way
      }

      current[i].lerp(target, 1 - Math.exp(-delta * 2.6));
      const speed = current[i].distanceTo(target);
      const hop = Math.abs(Math.sin(t * 9 + i)) * Math.min(0.5, speed * 0.15) + (side === 1 && slot !== 0 ? celebrating * Math.abs(Math.sin(t * 7 + i)) * 1.2 : 0);
      m.makeTranslation(current[i].x, 1.8 + hop, current[i].y);
      players.setMatrixAt(i, m);
    }
    players.instanceMatrix.needsUpdate = true;
  };
}

/* ---------- Scene ---------- */

const EMBER = 700;

export function setupStadium({ scene, camera, renderer, pointer }: Stage) {
  const small = window.innerWidth < 768;
  // Wet night air: a blue-grey murk that swallows the far city
  const haze = new THREE.Color(0x0c0f15);
  scene.fog = new THREE.FogExp2(haze, small ? 0.0026 : 0.0022);
  scene.background = haze;

  const kit = makeKit();
  const stadium = new THREE.Group();
  scene.add(stadium);

  buildPitch(stadium);
  buildBowl(stadium, kit);
  buildArcade(stadium, kit);
  buildTowers(stadium, kit);
  buildPortals(stadium, kit);
  buildCathedral(stadium, kit);
  const beams = buildFloodlights(stadium, kit);
  const crowd = buildCrowd(stadium, small ? 9000 : 20000);
  const fireworks = buildFireworks(stadium, small ? 22 : 36, small ? 110 : 170);
  const playMatch = buildMatch(stadium);
  const pulseCity = buildCity(scene, kit, small);
  const rain = buildRain(scene, small ? 2500 : 7000);

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
  const flare = new THREE.PointLight(0xffffff, 0, 500, 1.2);
  flare.position.set(0, 90, 0);
  scene.add(flare);

  return (time: number, delta: number) => {
    const t = time % LOOP;
    playMatch(t, delta);

    // Crowd: murmur, rising as the chance develops, eruption at the goal
    const sinceGoal = t - GOAL_AT;
    const excite = sinceGoal < 0
      ? 0.05 + 0.3 * smooth(clamp01((t - 11.5) / 4.5))
      : Math.max(0.08, Math.exp(-sinceGoal * 0.22)) * (1 - smooth(clamp01((t - RESET_AT) / 3)) * 0.8);
    const pointScale = renderer.domElement.height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    crowd.uniforms.uTime.value = time;
    crowd.uniforms.uExcite.value = excite;
    crowd.uniforms.uScale.value = pointScale;
    fireworks.uniforms.uT.value = sinceGoal;
    fireworks.uniforms.uScale.value = pointScale;
    rain.uniforms.uTime.value = time;
    kit.glass.opacity = 0.5 + excite * 0.45 + Math.sin(time * 1.3) * 0.05;
    beams.opacity = 0.055 + excite * 0.06;
    (bowlGlow.material as THREE.SpriteMaterial).opacity = 0.26 + excite * 0.3;
    for (const ember of embers) ember.intensity = EMBER * (0.8 + excite * 1.2);
    flare.intensity = sinceGoal > 0 && sinceGoal < 8 ? 1800 * Math.exp(-sinceGoal * 0.5) * (0.7 + 0.3 * Math.sin(time * 23)) : 0;
    pulseCity(time, excite);

    // The blimp: one slow lap every ~100 seconds
    // It starts opposite the cathedral, and climbs as it passes behind the great tower
    const angle = time * 0.062 - 1.9;
    const lift = Math.max(0, Math.sin(angle)) ** 2;
    const radius = 244 + Math.sin(time * 0.05) * 16 + lift * 70;
    camera.position.set(Math.cos(angle) * radius + pointer.x * 8, 150 + Math.sin(time * 0.08) * 12 + pointer.y * 5 + lift * 96, Math.sin(angle) * radius * 0.86);
    camera.lookAt(0, 6, 0);
  };
}
