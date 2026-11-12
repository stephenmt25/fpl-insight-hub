import * as THREE from "three";
import { BLOOD, CHROME, type Stage } from "./stage";
import { createPitchLines } from "./models";

/**
 * A gothic cathedral stadium seen from a circling blimp: superellipse bowl,
 * lancet-window arcade, buttress piers, spired towers, a crowd of point
 * sprites, and a 28-second match loop that ends in a goal and chrome fireworks.
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

function buildBowl(group: THREE.Group) {
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
  group.add(new THREE.Mesh(stand, new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.95, side: THREE.DoubleSide })));

  // Outer wall
  const wall: number[] = [];
  const wallIndex: number[] = [];
  for (let s = 0; s <= segments; s++) {
    const p = ring((s / segments) * Math.PI * 2, WALL_OFFSET);
    wall.push(p.x, 0, p.z, p.x, WALL_HEIGHT, p.z);
    if (s < segments) wallIndex.push(s * 2, s * 2 + 1, s * 2 + 2, s * 2 + 2, s * 2 + 1, s * 2 + 3);
  }
  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3));
  wallGeometry.setIndex(wallIndex);
  wallGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(wallGeometry, new THREE.MeshStandardMaterial({ color: 0x14141b, metalness: 0.5, roughness: 0.6, side: THREE.DoubleSide })));

  // Chrome parapet along the top of the wall and the pitch-side rail
  const concourse = STAND_START + TIER_GAP[0] * ROW_DEPTH;
  for (const [offset, y, radius] of [[WALL_OFFSET, WALL_HEIGHT, 0.5], [STAND_START - 0.6, 1.2, 0.18], [concourse, 1.4 + TIER_GAP[0] * ROW_RISE, 0.22]] as const) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 120 }, (_, i) => ring((i / 120) * Math.PI * 2, offset, y)), true);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 360, radius, 6, true), CHROME()));
  }
}

function buildArcade(group: THREE.Group) {
  const bays = 76;
  const thetas = evenThetas(bays, WALL_OFFSET);
  const windowShape = lancet(6.2, 22);
  const hole = lancet(4.6, 20.4);
  windowShape.holes.push(new THREE.Path(hole.getPoints(12).map((p) => new THREE.Vector2(p.x, p.y + 0.8))));
  const frameGeometry = new THREE.ExtrudeGeometry(windowShape, { depth: 0.9, bevelEnabled: false, curveSegments: 10 });
  const paneGeometry = new THREE.ShapeGeometry(lancet(4.8, 21), 10);

  const frames = new THREE.InstancedMesh(frameGeometry, CHROME(), bays * 2);
  const paneMaterial = new THREE.MeshBasicMaterial({ color: BLOOD, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const panes = new THREE.InstancedMesh(paneGeometry, paneMaterial, bays * 2);
  const piers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, WALL_HEIGHT + 4, 3), new THREE.MeshStandardMaterial({ color: 0x1b1b24, metalness: 0.7, roughness: 0.45 }), bays);
  const pinnacles = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 11, 4), CHROME(), bays);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const tiltQ = new THREE.Quaternion();
  const xAxis = new THREE.Vector3(1, 0, 0);
  /** Matrix for something on the wall at `theta`: `out` metres outside it, facing outward, optionally tilted. */
  const place = (theta: number, out: number, y: number, scale: number, tilt = 0) => {
    const n = outwardNormal(theta, WALL_OFFSET);
    q.setFromAxisAngle(up, Math.atan2(n.x, n.z));
    if (tilt) q.multiply(tiltQ.setFromAxisAngle(xAxis, tilt));
    return m.compose(ring(theta, WALL_OFFSET, y).addScaledVector(n, out), q, new THREE.Vector3(scale, scale, scale));
  };

  // Window tracery: a mullion and an oculus in the head of each tall window
  const mullions = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 14, 0.5), CHROME(), bays);
  const oculi = new THREE.InstancedMesh(new THREE.TorusGeometry(1.25, 0.2, 6, 20), CHROME(), bays);

  // Flying buttresses: a free-standing pier outside the wall, tied back to it by a sloping flyer
  const stone = new THREE.MeshStandardMaterial({ color: 0x1b1b24, metalness: 0.7, roughness: 0.45 });
  const FLY_OUT = 12;
  const outerPiers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 30, 2.6), stone, bays);
  const outerPinnacles = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 9, 4), CHROME(), bays);
  const flyerRun = FLY_OUT - 1.4;
  const flyerRise = 11;
  const flyers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 1.1, Math.hypot(flyerRun, flyerRise)), stone, bays);
  const crosses = new THREE.InstancedMesh(crossGeometry(3.2), CHROME(), bays / 2);

  // Rib vault: chrome ribs arching from the wall head in over the upper tier
  const ribCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, -2), new THREE.Vector3(0, 9, -12));
  const ribs = new THREE.InstancedMesh(new THREE.TubeGeometry(ribCurve, 12, 0.24, 5), CHROME(), bays);
  const ribTips: THREE.Vector3[] = [];
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
    ribTips.push(ring(between, WALL_OFFSET, WALL_HEIGHT + 9).addScaledVector(outwardNormal(between, WALL_OFFSET), -12));
  });
  // The ring beam the ribs meet at
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribTips, true), 400, 0.3, 6, true), CHROME()));
  group.add(frames, panes, piers, pinnacles, mullions, oculi, outerPiers, outerPinnacles, flyers, crosses, ribs);
  return paneMaterial;
}

function buildTowers(group: THREE.Group): THREE.Vector3[] {
  const tops: THREE.Vector3[] = [];
  const stone = new THREE.MeshStandardMaterial({ color: 0x15151d, metalness: 0.6, roughness: 0.5 });
  const chrome = CHROME();
  const glow = new THREE.MeshBasicMaterial({ color: BLOOD, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  evenThetas(8, WALL_OFFSET).forEach((theta0, i) => {
    const theta = theta0 + Math.PI / 8;
    const tall = i % 2 === 0;
    const height = tall ? 74 : 54;
    const width = tall ? 11 : 8.5;
    const n = outwardNormal(theta, WALL_OFFSET);
    const tower = new THREE.Group();
    tower.position.copy(ring(theta, WALL_OFFSET).addScaledVector(n, width * 0.55));
    tower.rotation.y = Math.atan2(n.x, n.z);

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), stone);
    shaft.position.y = height / 2;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, height * 0.75, 8), chrome);
    spire.position.y = height + height * 0.375;
    spire.rotation.y = Math.PI / 8;
    tower.add(shaft, spire);

    const cross = new THREE.Mesh(crossGeometry(width * 0.75), chrome);
    cross.position.y = height * 1.75 - 1;
    tower.add(cross);
    for (const level of [0.3, 0.62, 1]) {
      const belt = new THREE.Mesh(new THREE.BoxGeometry(width + 1.2, 1.1, width + 1.2), chrome);
      belt.position.y = height * level;
      tower.add(belt);
    }
    // Gargoyle spikes jutting from the corners under the spire
    for (let corner = 0; corner < 4; corner++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.55, width * 0.55, 4), chrome);
      const angle = Math.PI / 4 + (corner * Math.PI) / 2;
      spike.position.set(Math.cos(angle) * width * 0.9, height * 0.97, Math.sin(angle) * width * 0.9);
      spike.rotation.set(0, -angle, -Math.PI / 2);
      tower.add(spike);
    }
    if (tall) tops.push(tower.position.clone().setY(height * 0.95));

    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(width * 0.14, height * 0.26, 4), chrome);
      pinnacle.position.set((dx * width) / 2, height + height * 0.13, (dz * width) / 2);
      tower.add(pinnacle);
    }
    // Belfry slits on every tower, a rose window on the tall ones
    for (const face of [0, 1, 2, 3]) {
      const slit = new THREE.Mesh(new THREE.ShapeGeometry(lancet(width * 0.22, height * 0.2), 8), glow);
      slit.position.y = height * 0.72;
      slit.rotation.y = (face * Math.PI) / 2;
      slit.translateZ(width / 2 + 0.05);
      tower.add(slit);
    }
    if (tall) {
      const rose = roseWindow(width * 0.32, glow, chrome, 8);
      rose.position.set(0, height * 0.48, width / 2 + 0.2);
      tower.add(rose);
    }
    group.add(tower);
  });
  return tops;
}

/** Four gabled portals on the axes: a great rose window over a glowing door, twin turrets, a cross on the gable. */
function buildPortals(group: THREE.Group) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x15151d, metalness: 0.6, roughness: 0.5 });
  const chrome = CHROME();
  const glow = new THREE.MeshBasicMaterial({ color: BLOOD, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const gable = new THREE.Shape();
  gable.moveTo(-17, 0); gable.lineTo(17, 0); gable.lineTo(17, 46); gable.lineTo(0, 70); gable.lineTo(-17, 46); gable.closePath();
  const gableGeometry = new THREE.ExtrudeGeometry(gable, { depth: 4, bevelEnabled: false });
  const doorFrame = lancet(11, 24);
  doorFrame.holes.push(new THREE.Path(lancet(8.6, 22).getPoints(12)));
  const doorFrameGeometry = new THREE.ExtrudeGeometry(doorFrame, { depth: 1.2, bevelEnabled: false, curveSegments: 10 });

  for (const theta of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const n = outwardNormal(theta, WALL_OFFSET);
    const portal = new THREE.Group();
    portal.position.copy(ring(theta, WALL_OFFSET).addScaledVector(n, 13));
    portal.rotation.y = Math.atan2(n.x, n.z);

    portal.add(new THREE.Mesh(gableGeometry, stone));
    // Chrome coping along the gable's rake
    for (const side of [-1, 1]) {
      const rake = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(17, 24) + 1, 0.9, 4.8), chrome);
      rake.position.set(side * 8.5, 58, 2);
      rake.rotation.z = -side * Math.atan2(24, 17);
      portal.add(rake);
    }
    const rose = roseWindow(8.5, glow, chrome, 12);
    rose.position.set(0, 40, 4.15);
    portal.add(rose);

    const door = new THREE.Mesh(new THREE.ShapeGeometry(lancet(8.8, 22.4), 10), glow);
    door.position.set(0, 0.2, 4.1);
    const frame = new THREE.Mesh(doorFrameGeometry, chrome);
    frame.position.z = 4;
    portal.add(door, frame);
    for (const side of [-1, 1]) {
      const niche = new THREE.Mesh(new THREE.ShapeGeometry(lancet(3, 12), 8), glow);
      niche.position.set(side * 11.5, 6, 4.1);
      portal.add(niche);
      const turret = new THREE.Mesh(new THREE.BoxGeometry(5, 60, 5), stone);
      turret.position.set(side * 19.5, 30, 2);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(3.9, 22, 8), chrome);
      cap.position.set(side * 19.5, 71, 2);
      const finial = new THREE.Mesh(crossGeometry(3.4), chrome);
      finial.position.set(side * 19.5, 81, 2);
      portal.add(turret, cap, finial);
    }
    const cross = new THREE.Mesh(crossGeometry(8), chrome);
    cross.position.set(0, 69, 2);
    portal.add(cross);
    group.add(portal);
  }
}

/** Soft shafts of light from the tall towers down onto the pitch. */
function buildLightBeams(group: THREE.Group, origins: THREE.Vector3[]) {
  const material = new THREE.MeshBasicMaterial({ color: 0xcdd6ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const upAxis = new THREE.Vector3(0, 1, 0);
  for (const origin of origins) {
    const target = new THREE.Vector3(Math.sign(origin.x) * 22, 0, Math.sign(origin.z) * 14);
    const span = target.clone().sub(origin);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 24, span.length(), 20, 1, true), material);
    beam.position.copy(origin).addScaledVector(span, 0.5);
    beam.quaternion.setFromUnitVectors(upAxis, span.clone().negate().normalize());
    group.add(beam);
  }
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

export function setupStadium({ scene, camera, renderer, pointer }: Stage) {
  scene.fog = new THREE.FogExp2(0x07070a, 0.0019);
  const stadium = new THREE.Group();
  scene.add(stadium);

  const small = window.innerWidth < 768;
  buildPitch(stadium);
  buildBowl(stadium);
  const panes = buildArcade(stadium);
  const beams = buildLightBeams(stadium, buildTowers(stadium));
  buildPortals(stadium);
  const crowd = buildCrowd(stadium, small ? 9000 : 20000);
  const fireworks = buildFireworks(stadium, small ? 22 : 36, small ? 110 : 170);
  const playMatch = buildMatch(stadium);

  // Stars
  const stars = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(520);
    stars.set([v.x, Math.abs(v.y) * 0.8 + 30, v.z], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc9ccd6, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false })));

  // Faint plaza grid so the stadium doesn't float in a void
  const plaza = new THREE.GridHelper(1600, 80, 0x23242e, 0x111219);
  plaza.position.y = -0.4;
  scene.add(plaza);

  for (const radius of [150, 205, 270]) {
    const paving = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 1.4, 160), new THREE.MeshBasicMaterial({ color: 0x343642, side: THREE.DoubleSide }));
    paving.rotation.x = -Math.PI / 2;
    paving.position.y = -0.3;
    scene.add(paving);
  }
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(46, 48), new THREE.MeshBasicMaterial({ color: 0xe6e9f2, fog: false }));
  moonDisc.position.set(-620, 300, -520);
  moonDisc.lookAt(0, 60, 0);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(110, 48), new THREE.MeshBasicMaterial({ color: 0xaab4d6, transparent: true, opacity: 0.07, fog: false, depthWrite: false }));
  halo.position.copy(moonDisc.position).multiplyScalar(1.01);
  halo.lookAt(0, 60, 0);
  scene.add(halo, moonDisc);

  scene.add(new THREE.HemisphereLight(0x9aa3c2, 0x0a0a10, 0.9));
  const moon = new THREE.DirectionalLight(0xdfe6ff, 1.6);
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
    panes.opacity = 0.42 + excite * 0.5 + Math.sin(time * 1.3) * 0.05;
    beams.opacity = 0.045 + excite * 0.07;
    flare.intensity = sinceGoal > 0 && sinceGoal < 8 ? 9000 * Math.exp(-sinceGoal * 0.5) * (0.7 + 0.3 * Math.sin(time * 23)) : 0;

    // The blimp: one slow lap every ~100 seconds
    const angle = time * 0.062 + 0.9;
    const radius = 244 + Math.sin(time * 0.05) * 16;
    camera.position.set(Math.cos(angle) * radius + pointer.x * 8, 150 + Math.sin(time * 0.08) * 12 + pointer.y * 5, Math.sin(angle) * radius * 0.86);
    camera.lookAt(0, 6, 0);
  };
}
