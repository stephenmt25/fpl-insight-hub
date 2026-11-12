import * as THREE from "three";
import { mayhem } from "@/lib/mayhem";

/**
 * What happens to the cathedral when the Score button is hammered.
 *
 * Every goal adds heat; heat cools on its own. Past a threshold each goal
 * shakes loose a few more parts of the building, most fragile first: they
 * fall, tumble and lie as rubble until a worker runs out of a door and hoists
 * them back. Strip nearly everything off while the heat is high and the great
 * tower itself comes down, which locks scoring until a full rebuild is done.
 */

const GRAVITY = 42;
const HEAT_PER_GOAL = 0.055;
/** Heat lost per second, so only quick, consecutive goals build it. */
const HEAT_COOLING = 0.045;
/** Heat at which parts start coming off; below this a goal is just a celebration. */
const FIRST_CRACKS = 0.22;
const RISE_SECONDS = 1.3;
const WORKERS = 40;
const WORKER_SPEED = 26;
const COLLAPSE_SECONDS = 5.5;
const RUIN_SECONDS = 2.5;
const REBUILD_SECONDS = 24;
const CHUNKS = 90;
const HI_VIS = 0xffc21a;

const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Cheap deterministic jitter in [-1, 1]. */
export const wobble = (x: number) => Math.sin(x) * Math.sin(x * 1.7 + 1.3);

type PieceState = "intact" | "falling" | "rubble" | "claimed" | "rising";

interface Piece {
  /** 1 = first to go (pinnacles, crosses) … 4 = last before the tower (the relic). */
  tier: number;
  /** The object whose local space the piece's transform is expressed in. */
  space: THREE.Object3D;
  write: (position: THREE.Vector3, turn: THREE.Quaternion, scale: THREE.Vector3) => void;
  home: THREE.Vector3;
  homeTurn: THREE.Quaternion;
  scale: THREE.Vector3;
  pos: THREE.Vector3;
  turn: THREE.Quaternion;
  from: THREE.Vector3;
  fromTurn: THREE.Quaternion;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  state: PieceState;
  progress: number;
  /** Height of its origin when it lies on the ground. */
  rest: number;
  bounce: number;
  inTower: boolean;
  /** Told when the piece leaves (false) and when it is back in place (true). */
  onChange?: (standing: boolean) => void;
}

interface PieceOptions {
  rest?: number;
  bounce?: number;
  /** The mesh's geometry sits far from its own origin; move the origin to its middle so it tumbles about itself. */
  recentre?: boolean;
  onChange?: (standing: boolean) => void;
}

interface Worker {
  state: "idle" | "out" | "working" | "back";
  pos: THREE.Vector2;
  target: THREE.Vector2;
  door: THREE.Vector2;
  piece: Piece | null;
  timer: number;
  hoisted: boolean;
}

interface Chunk {
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  turn: THREE.Quaternion;
  spin: THREE.Vector3;
  size: THREE.Vector3;
  resting: boolean;
}

interface Site {
  group: THREE.Group;
  home: THREE.Vector3;
  world: THREE.Vector3;
  height: number;
  width: number;
}

export class Wreck {
  private pieces: Piece[] = [];
  /** Intact pieces, sorted so the most fragile is last (cheap to pop). */
  private queue: Piece[] = [];
  /** Rubble nobody has been sent to yet. */
  private waiting: Piece[] = [];
  /** Pieces in motion: falling or being hoisted back. */
  private active = new Set<Piece>();
  private dirty = new Set<THREE.InstancedMesh>();
  private pending: (() => void)[] = [];

  private workers: Worker[] = [];
  private bodies!: THREE.InstancedMesh;
  private helmets!: THREE.InstancedMesh;
  private doors: THREE.Vector2[] = [];

  private heat = 0;
  private burst = 0;
  private goals = 0;
  private phase: "standing" | "collapsing" | "ruin" | "rebuilding" = "standing";
  /** Seconds spent in the current phase. */
  private clock = 0;
  private sinceFall = 0;
  private progress = 0;
  private reportIn = 0;

  private site: Site | null = null;
  private chunks: Chunk[] = [];
  private chunkMesh!: THREE.InstancedMesh;
  private chunksOut = false;
  private dust: THREE.Sprite[] = [];
  private scaffold!: THREE.LineSegments;
  private crane!: THREE.Group;
  private cable!: THREE.Mesh;
  private hook!: THREE.Mesh;
  /** Rebuild schedule: which piece goes back at what fraction of the rebuild, latest first. */
  private plan: { at: number; piece: Piece }[] = [];
  /** Where the rebuild crew stands, in world space. */
  private posts: THREE.Vector2[] = [];

  // Scratch objects
  private v = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private m = new THREE.Matrix4();
  private hidden = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(private scene: THREE.Scene, private glow: THREE.Texture) {}

  /* ---------- Registration (resolved in seal, once everything is in the scene) ---------- */

  /** Every instance of `mesh` can break off. */
  instances(mesh: THREE.InstancedMesh, tier: number, rest = 1) {
    this.pending.push(() => {
      mesh.frustumCulled = false; // instances will travel well outside the original bounds
      const m = new THREE.Matrix4();
      for (let i = 0; i < mesh.count; i++) {
        const piece = this.blank(tier, mesh, rest, (p, q, s) => {
          mesh.setMatrixAt(i, m.compose(p, q, s));
          this.dirty.add(mesh);
        });
        mesh.getMatrixAt(i, m);
        m.decompose(piece.home, piece.homeTurn, piece.scale);
      }
    });
  }

  /** A single mesh or group can break off its parent. */
  object(object: THREE.Object3D, tier: number, { rest = 1, bounce = 0, recentre = false, onChange }: PieceOptions = {}) {
    this.pending.push(() => {
      if (recentre && object instanceof THREE.Mesh) {
        const centre = new THREE.Box3().setFromBufferAttribute(object.geometry.getAttribute("position") as THREE.BufferAttribute).getCenter(new THREE.Vector3());
        object.geometry.translate(-centre.x, -centre.y, -centre.z);
        object.position.add(centre);
      }
      const piece = this.blank(tier, object.parent!, rest, (p, q) => {
        object.position.copy(p);
        object.quaternion.copy(q);
      });
      piece.home.copy(object.position);
      piece.homeTurn.copy(object.quaternion);
      piece.bounce = bounce;
      piece.onChange = onChange;
    });
  }

  /** The great tower: the last thing to go, and the thing whose fall forces a rebuild. */
  tower(group: THREE.Group, height: number, width: number) {
    this.site = { group, home: group.position.clone(), world: new THREE.Vector3(), height, width };
  }

  /** Call once the whole building is in the scene. `doors` are where workers come out, in world x/z. */
  seal(doors: THREE.Vector2[]) {
    this.doors = doors;
    this.pending.forEach((register) => register());
    this.pending = [];
    for (const piece of this.pieces) {
      piece.pos.copy(piece.home);
      piece.turn.copy(piece.homeTurn);
      for (let o: THREE.Object3D | null = piece.space; o; o = o.parent) if (o === this.site?.group) piece.inTower = true;
    }
    this.requeueAll();
    this.buildCrew();
    if (this.site) this.buildSite(this.site);
  }

  private blank(tier: number, space: THREE.Object3D, rest: number, write: Piece["write"]): Piece {
    const piece: Piece = {
      tier, space, write, rest, bounce: 0, inTower: false, state: "intact", progress: 0,
      home: new THREE.Vector3(), homeTurn: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1),
      pos: new THREE.Vector3(), turn: new THREE.Quaternion(), from: new THREE.Vector3(), fromTurn: new THREE.Quaternion(),
      velocity: new THREE.Vector3(), spin: new THREE.Vector3(),
    };
    this.pieces.push(piece);
    return piece;
  }

  private requeueAll() {
    // Shuffled so damage is spread round the building, then ordered sturdiest-first so pop() takes the most fragile
    this.queue = this.pieces.filter((p) => p.state === "intact").sort(() => Math.random() - 0.5).sort((a, b) => b.tier - a.tier);
  }

  /* ---------- Per-frame ---------- */

  /**
   * Advances everything by `dt` seconds after `goals` new goals.
   * Returns what the scene needs to dress the celebration.
   */
  update(time: number, dt: number, goals: number) {
    if (this.phase === "standing") {
      for (let g = 0; g < goals; g++) this.goal();
      if (this.heat === 0) this.goals = 0;
    }
    this.heat = Math.max(0, this.heat - HEAT_COOLING * dt);
    this.burst = Math.max(0, this.burst - dt * 0.5);

    for (const piece of this.active) {
      if (piece.state === "falling") this.fall(piece, dt);
      else this.rise(piece, dt);
    }
    const rumble = this.runSite(time, dt);
    this.runCrew(time, dt);
    this.dirty.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
    this.dirty.clear();

    this.reportIn -= dt;
    if (dt > 0 && this.reportIn <= 0) this.report();

    return {
      heat: this.heat,
      /** 1 at the moment of a goal, fading over a couple of seconds. */
      burst: this.burst,
      /** 0-1: how hard the building should shake. */
      shake: Math.min(1, this.heat * this.heat + rumble),
      towerUp: this.phase === "standing",
    };
  }

  private report() {
    this.reportIn = 0.12;
    mayhem.report({
      ready: true,
      goals: this.goals,
      heat: Math.round(this.heat * 50) / 50,
      integrity: this.phase === "standing" ? Math.round((this.queue.length / Math.max(1, this.pieces.length)) * 100) / 100 : 0,
      phase: this.phase === "standing" ? "standing" : this.phase === "rebuilding" ? "rebuilding" : "collapsing",
      rebuild: this.phase === "rebuilding" ? Math.round(this.progress * 100) / 100 : 0,
    });
  }

  private goal() {
    this.goals++;
    this.burst = 1;
    this.heat = Math.min(1, this.heat + HEAT_PER_GOAL);
    if (this.heat < FIRST_CRACKS) return;

    // The hotter it is, the more comes off with each goal: one piece at first, seventeen at the limit
    const strain = (this.heat - FIRST_CRACKS) / (1 - FIRST_CRACKS);
    const count = Math.round(1 + strain * strain * 16);
    for (let i = 0; i < count && this.queue.length; i++) this.shatter(this.queue.pop()!);

    if (this.site && this.heat > 0.85 && this.queue.length <= this.pieces.length * 0.04) this.bringDownTower();
  }

  private shatter(piece: Piece) {
    piece.state = "falling";
    this.active.add(piece);
    // Thrown outwards from the middle of whatever it was attached to
    const flat = Math.hypot(piece.home.x, piece.home.z);
    const ox = flat > 0.5 ? piece.home.x / flat : 0;
    const oz = flat > 0.5 ? piece.home.z / flat : 1;
    const push = 5 + Math.random() * 11;
    piece.velocity.set(ox * push + (Math.random() - 0.5) * 6, 3 + Math.random() * 9, oz * push + (Math.random() - 0.5) * 6);
    piece.spin.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(7);
    piece.onChange?.(false);
  }

  private fall(piece: Piece, dt: number) {
    piece.velocity.y -= GRAVITY * dt;
    piece.pos.addScaledVector(piece.velocity, dt);
    const speed = piece.spin.length();
    if (speed > 0) piece.turn.premultiply(this.q.setFromAxisAngle(this.v.copy(piece.spin).divideScalar(speed), speed * dt));
    if (piece.pos.y <= piece.rest) {
      piece.pos.y = piece.rest;
      if (piece.bounce && Math.abs(piece.velocity.y) > 7) {
        piece.velocity.y *= -piece.bounce;
        piece.velocity.x *= 0.7;
        piece.velocity.z *= 0.7;
      } else {
        piece.state = "rubble";
        this.active.delete(piece);
        this.waiting.push(piece);
      }
    }
    piece.write(piece.pos, piece.turn, piece.scale);
  }

  /** Start lifting a piece back to where it belongs, from wherever it is now. */
  private hoist(piece: Piece) {
    if (piece.state === "intact" || piece.state === "rising") return;
    piece.from.copy(piece.pos);
    piece.fromTurn.copy(piece.turn);
    piece.progress = 0;
    piece.state = "rising";
    this.active.add(piece);
  }

  private rise(piece: Piece, dt: number) {
    piece.progress = Math.min(1, piece.progress + dt / RISE_SECONDS);
    const u = smooth(piece.progress);
    piece.pos.lerpVectors(piece.from, piece.home, u);
    piece.pos.y += Math.sin(Math.PI * piece.progress) * 5; // swung up and over, not dragged
    piece.turn.slerpQuaternions(piece.fromTurn, piece.homeTurn, u);
    piece.write(piece.pos, piece.turn, piece.scale);
    if (piece.progress >= 1) this.settle(piece);
  }

  private settle(piece: Piece) {
    piece.state = "intact";
    piece.pos.copy(piece.home);
    piece.turn.copy(piece.homeTurn);
    piece.write(piece.pos, piece.turn, piece.scale);
    this.active.delete(piece);
    piece.onChange?.(true);
    if (this.phase === "standing") {
      this.queue.push(piece);
      this.queue.sort((a, b) => b.tier - a.tier);
    }
  }

  /* ---------- Workers ---------- */

  private buildCrew() {
    this.bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.8, 1.7, 3, 8), new THREE.MeshBasicMaterial({ color: HI_VIS }), WORKERS);
    this.helmets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.62, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), WORKERS);
    for (const mesh of [this.bodies, this.helmets]) {
      mesh.frustumCulled = false;
      for (let i = 0; i < WORKERS; i++) mesh.setMatrixAt(i, this.hidden);
      this.scene.add(mesh);
    }
    this.workers = Array.from({ length: WORKERS }, () => ({
      state: "idle" as const, pos: new THREE.Vector2(), target: new THREE.Vector2(), door: new THREE.Vector2(), piece: null, timer: 0, hoisted: false,
    }));
  }

  private nextJob() {
    while (this.waiting.length) {
      const piece = this.waiting.shift()!;
      if (piece.state === "rubble") return piece;
    }
    return null;
  }

  private dispatch(worker: Worker, x: number, z: number, piece: Piece | null) {
    worker.target.set(x, z);
    let nearest = this.doors[0];
    for (const door of this.doors) if (door.distanceToSquared(worker.target) < nearest.distanceToSquared(worker.target)) nearest = door;
    worker.door.copy(nearest);
    worker.pos.copy(nearest);
    worker.piece = piece;
    worker.hoisted = false;
    worker.state = "out";
  }

  private runCrew(time: number, dt: number) {
    const rebuilding = this.phase === "rebuilding";
    this.workers.forEach((worker, i) => {
      if (worker.state === "idle") {
        if (rebuilding && this.posts.length) {
          // Everyone reports to the cathedral for the rebuild
          const post = this.posts[i % this.posts.length];
          this.dispatch(worker, post.x, post.y, null);
        } else if (this.phase === "standing") {
          const piece = this.nextJob();
          if (piece) {
            piece.state = "claimed";
            const at = piece.space.localToWorld(this.v.copy(piece.pos));
            this.dispatch(worker, at.x + (Math.random() - 0.5) * 3, at.z + (Math.random() - 0.5) * 3, piece);
          }
        }
      }

      if (worker.state === "out" || worker.state === "back") {
        const goal = worker.state === "out" ? worker.target : worker.door;
        const dx = goal.x - worker.pos.x;
        const dz = goal.y - worker.pos.y;
        const distance = Math.hypot(dx, dz);
        const step = WORKER_SPEED * dt;
        if (distance <= step) {
          worker.pos.copy(goal);
          worker.timer = 0;
          worker.state = worker.state === "out" ? "working" : "idle";
        } else {
          worker.pos.x += (dx / distance) * step;
          worker.pos.y += (dz / distance) * step;
        }
      } else if (worker.state === "working") {
        worker.timer += dt;
        const piece = worker.piece;
        if (!piece) {
          if (!rebuilding) worker.state = "back"; // rebuild crew stands down when the job is done
        } else if (!worker.hoisted) {
          if (piece.state !== "claimed") {
            worker.piece = null; // the rebuild got to it first
            worker.state = "back";
          } else if (worker.timer > 1) {
            this.hoist(piece);
            worker.hoisted = true;
          }
        } else if (worker.timer > 1 + RISE_SECONDS) {
          worker.piece = null;
          worker.state = "back";
        }
      }

      if (worker.state === "idle") {
        this.bodies.setMatrixAt(i, this.hidden);
        this.helmets.setMatrixAt(i, this.hidden);
      } else {
        // Running has a quick bounce; working is a bigger, slower heave
        const hop = worker.state === "working" ? Math.abs(Math.sin(time * 9 + i)) * 0.7 : Math.abs(Math.sin(time * 15 + i)) * 0.3;
        this.bodies.setMatrixAt(i, this.m.makeTranslation(worker.pos.x, 1.7 + hop, worker.pos.y));
        this.helmets.setMatrixAt(i, this.m.makeTranslation(worker.pos.x, 3.45 + hop, worker.pos.y));
      }
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    this.helmets.instanceMatrix.needsUpdate = true;
  }

  /* ---------- The great tower ---------- */

  private buildSite(site: Site) {
    const { group, height, width } = site;
    group.updateWorldMatrix(true, false);
    group.getWorldPosition(site.world);
    const cathedral = group.parent!;

    // Masonry that bursts out of the tower as it goes
    this.chunkMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x2c2e34 }), CHUNKS);
    this.chunkMesh.frustumCulled = false;
    for (let i = 0; i < CHUNKS; i++) {
      this.chunkMesh.setMatrixAt(i, this.hidden);
      this.chunks.push({
        pos: new THREE.Vector3(), velocity: new THREE.Vector3(), turn: new THREE.Quaternion(), spin: new THREE.Vector3(),
        size: new THREE.Vector3(2 + Math.random() * 5, 1.5 + Math.random() * 4, 2 + Math.random() * 5), resting: true,
      });
    }
    this.scene.add(this.chunkMesh);

    for (let i = 0; i < 18; i++) {
      const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: 0x767b86, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      puff.visible = false;
      this.dust.push(puff);
      this.scene.add(puff);
    }

    // Scaffolding that climbs with the new tower
    this.scaffold = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.BoxGeometry(width + 9, height, width + 9, 3, 9, 3)),
      new THREE.LineBasicMaterial({ color: HI_VIS, transparent: true, opacity: 0.5 }),
    );
    this.scaffold.position.copy(site.world);
    this.scaffold.visible = false;
    this.scene.add(this.scaffold);

    // A tower crane beside the nave, its jib swinging over the work
    const yellow = new THREE.MeshBasicMaterial({ color: 0xd9a100 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x23262d });
    const mastHeight = height + 42;
    const part = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      return mesh;
    };
    this.crane = new THREE.Group();
    this.cable = part(0.45, 1, 0.45, 44, mastHeight, 0, yellow);
    this.hook = part(2.4, 2.4, 2.4, 44, mastHeight, 0, yellow);
    this.crane.add(
      part(2.6, mastHeight, 2.6, 0, mastHeight / 2, 0, yellow),
      part(72, 1.9, 1.9, 21, mastHeight, 0, yellow),
      part(7, 4.5, 4.5, -12, mastHeight - 1.6, 0, dark),
      part(4.2, 3.6, 4.2, 0, mastHeight - 3.2, 3, dark),
      this.cable,
      this.hook,
    );
    this.crane.position.copy(cathedral.localToWorld(new THREE.Vector3(width / 2 + 36, 0, group.position.z)));
    this.crane.visible = false;
    this.scene.add(this.crane);

    // The crew lines up round the outside of the cathedral: down one side, across the front, back up the other
    for (let i = 0; i < WORKERS; i++) {
      const s = (i / WORKERS) * 208;
      const local = s < 60 ? new THREE.Vector3(-44, 0, 6 + s) : s < 148 ? new THREE.Vector3(-44 + (s - 60), 0, 70) : new THREE.Vector3(44, 0, 66 - (s - 148));
      const world = cathedral.localToWorld(local);
      this.posts.push(new THREE.Vector2(world.x, world.z));
    }
  }

  private bringDownTower() {
    this.phase = "collapsing";
    this.clock = 0;
    this.sinceFall = 0;
    this.chunksOut = false;
    this.waiting = [];
    // Whatever was still clinging on goes too
    while (this.queue.length) this.shatter(this.queue.pop()!);
    this.report();
  }

  private beginRebuild() {
    this.phase = "rebuilding";
    this.clock = 0;
    this.progress = 0;
    const broken = this.pieces.filter((p) => p.state !== "intact").sort(() => Math.random() - 0.5);
    const outside = broken.filter((p) => !p.inTower);
    // The tower's own fittings go back last, plainest first and the relic at the very end
    const inside = broken.filter((p) => p.inTower).sort((a, b) => a.tier - b.tier);
    this.plan = [
      ...outside.map((piece, k) => ({ piece, at: 0.04 + (0.8 * k) / Math.max(1, outside.length) })),
      ...inside.map((piece, k) => ({ piece, at: 0.87 + (0.1 * k) / Math.max(1, inside.length) })),
    ].reverse();
    this.report();
  }

  private finishRebuild() {
    for (const piece of this.pieces) if (piece.state !== "intact") this.settle(piece);
    this.active.clear();
    this.waiting = [];
    this.plan = [];
    this.phase = "standing";
    this.heat = 0;
    this.burst = 0;
    this.goals = 0;
    this.requeueAll();
    this.scaffold.visible = false;
    this.crane.visible = false;
    this.dust.forEach((puff) => { puff.visible = false; });
    for (let i = 0; i < CHUNKS; i++) this.chunkMesh.setMatrixAt(i, this.hidden);
    this.chunkMesh.instanceMatrix.needsUpdate = true;
    this.chunksOut = false;
    this.report();
  }

  /** Runs the collapse and the rebuild. Returns extra shake for the rest of the building. */
  private runSite(time: number, dt: number) {
    const site = this.site;
    if (!site || this.phase === "standing") return 0;
    this.clock += dt;
    this.sinceFall += dt;
    const { group, home, height } = site;
    const drop = height + 70;
    let rumble = 0;
    let clear = 1; // how much of the rubble is still lying about

    if (this.phase === "collapsing") {
      // A second of violent shaking, then it goes straight down, leaning as it sinks
      const u = clamp01((this.clock - 1.2) / (COLLAPSE_SECONDS - 1.2));
      rumble = this.clock < 1.2 ? this.clock / 1.2 : 1 - u * 0.7;
      group.position.set(home.x + wobble(time * 37) * rumble * 1.8, home.y - u * u * drop, home.z + wobble(time * 31 + 4) * rumble * 1.8);
      group.rotation.set(-0.07 * u, 0, 0.15 * u);
      if (!this.chunksOut && this.clock > 1) this.launchChunks(site);
      if (this.clock >= COLLAPSE_SECONDS) {
        group.visible = false;
        this.phase = "ruin";
        this.clock = 0;
      }
    } else if (this.phase === "ruin") {
      if (this.clock >= RUIN_SECONDS) this.beginRebuild();
    } else {
      const p = Math.min(1, this.clock / REBUILD_SECONDS);
      this.progress = p;
      const built = smooth(clamp01((p - 0.06) / 0.8));
      group.visible = true;
      group.position.set(home.x, home.y - (1 - built) * drop, home.z);
      group.rotation.set(0, 0, 0);

      const wrap = Math.max(0.04, built);
      this.scaffold.visible = true;
      this.scaffold.scale.y = wrap;
      this.scaffold.position.y = (height * wrap) / 2;
      (this.scaffold.material as THREE.LineBasicMaterial).opacity = 0.5 * (1 - smooth(clamp01((p - 0.93) / 0.07)));

      const reach = smooth(clamp01(p / 0.06)) * (1 - smooth(clamp01((p - 0.94) / 0.06)));
      this.crane.visible = reach > 0.001;
      this.crane.scale.setScalar(Math.max(0.001, reach));
      this.crane.rotation.y = Math.PI + Math.sin(time * 0.7) * 0.9;
      // The hook winds up and down on its cable, `slack` metres below the jib
      const jib = height + 42;
      const slack = 16 + (1 + Math.sin(time * 1.6)) * 14;
      this.cable.scale.y = slack;
      this.cable.position.y = jib - slack / 2;
      this.hook.position.y = jib - slack;

      while (this.plan.length && this.plan[this.plan.length - 1].at <= p) this.hoist(this.plan.pop()!.piece);
      clear = 1 - smooth(clamp01(p / 0.45));
      if (p >= 1) this.finishRebuild();
    }

    // finishRebuild() may just have put everything away
    if (this.site && this.isDown()) {
      this.runChunks(dt, clear);
      this.runDust(site);
    }
    return rumble;
  }

  private isDown() {
    return this.phase !== "standing";
  }

  private launchChunks(site: Site) {
    this.chunksOut = true;
    for (const chunk of this.chunks) {
      const angle = Math.random() * Math.PI * 2;
      const push = 4 + Math.random() * 20;
      chunk.pos.set(site.world.x + (Math.random() - 0.5) * site.width, 6 + Math.random() * site.height * 0.8, site.world.z + (Math.random() - 0.5) * site.width);
      chunk.velocity.set(Math.cos(angle) * push, -4 + Math.random() * 14, Math.sin(angle) * push);
      chunk.spin.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5);
      chunk.resting = false;
    }
  }

  private runChunks(dt: number, clear: number) {
    if (!this.chunksOut) return;
    this.chunks.forEach((chunk, i) => {
      if (!chunk.resting) {
        chunk.velocity.y -= GRAVITY * dt;
        chunk.pos.addScaledVector(chunk.velocity, dt);
        const speed = chunk.spin.length();
        if (speed > 0) chunk.turn.premultiply(this.q.setFromAxisAngle(this.v.copy(chunk.spin).divideScalar(speed), speed * dt));
        if (chunk.pos.y <= chunk.size.y / 2) {
          chunk.pos.y = chunk.size.y / 2;
          chunk.resting = true;
        }
      }
      this.chunkMesh.setMatrixAt(i, this.m.compose(chunk.pos, chunk.turn, this.v.copy(chunk.size).multiplyScalar(clear)));
    });
    this.chunkMesh.instanceMatrix.needsUpdate = true;
  }

  private runDust(site: Site) {
    const life = 7;
    this.dust.forEach((puff, i) => {
      const age = this.sinceFall - 0.9 - i * 0.16;
      puff.visible = age > 0 && age < life;
      if (!puff.visible) return;
      const angle = i * 2.4;
      const spread = 5 + age * 7;
      puff.position.set(site.world.x + Math.cos(angle) * spread, 5 + age * 5, site.world.z + Math.sin(angle) * spread);
      puff.scale.setScalar(24 + age * 26);
      puff.material.opacity = 0.42 * (1 - age / life);
    });
  }
}
