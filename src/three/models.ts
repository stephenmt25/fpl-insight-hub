import * as THREE from "three";
import { BLOOD, CHROME } from "./stage";

/**
 * A football as a true truncated icosahedron: chrome shell, 12 black pentagon
 * panels and glowing seams along all 90 edges.
 */
export function createFootball(radius = 1): THREE.Group {
  const group = new THREE.Group();

  // The 12 icosahedron vertices and their 30 edges
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t],
    [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const edgeLength = 2;
  const neighbours = verts.map((v, i) => verts.map((w, j) => (i !== j && Math.abs(v.distanceTo(w) - edgeLength) < 1e-6 ? j : -1)).filter((j) => j >= 0));

  const onSphere = (v: THREE.Vector3, r = radius) => v.clone().normalize().multiplyScalar(r);
  const seam: [THREE.Vector3, THREE.Vector3][] = [];
  const pentagonGeometry: number[] = [];

  verts.forEach((v, i) => {
    // Cutting each corner a third of the way along its edges leaves a pentagon
    const axis = v.clone().normalize();
    const ref = new THREE.Vector3().crossVectors(axis, Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    const ref2 = new THREE.Vector3().crossVectors(axis, ref);
    const ring = neighbours[i]
      .map((j) => {
        const p = v.clone().lerp(verts[j], 1 / 3);
        const d = p.clone().sub(v);
        return { j, p, angle: Math.atan2(d.dot(ref2), d.dot(ref)) };
      })
      .sort((a, b) => a.angle - b.angle);

    const centre = onSphere(v, radius * 1.004);
    ring.forEach((corner, k) => {
      const next = ring[(k + 1) % ring.length];
      const a = onSphere(corner.p, radius * 1.004);
      const b = onSphere(next.p, radius * 1.004);
      seam.push([a, b]);
      pentagonGeometry.push(centre.x, centre.y, centre.z, a.x, a.y, a.z, b.x, b.y, b.z);
      // The middle third of each icosahedron edge is a hexagon-hexagon seam
      if (i < corner.j) seam.push([a, onSphere(v.clone().lerp(verts[corner.j], 2 / 3), radius * 1.004)]);
    });
  });

  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 0.972, 64, 48), CHROME()));

  const pentagons = new THREE.BufferGeometry();
  pentagons.setAttribute("position", new THREE.Float32BufferAttribute(pentagonGeometry, 3));
  pentagons.computeVertexNormals();
  group.add(new THREE.Mesh(pentagons, new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide })));

  const seamMaterial = new THREE.MeshStandardMaterial({ color: BLOOD, emissive: BLOOD, emissiveIntensity: 1.6, roughness: 0.4 });
  const up = new THREE.Vector3(0, 1, 0);
  const tube = new THREE.CylinderGeometry(radius * 0.011, radius * 0.011, 1, 6);
  const seams = new THREE.InstancedMesh(tube, seamMaterial, seam.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  seam.forEach(([a, b], i) => {
    const dir = b.clone().sub(a);
    q.setFromUnitVectors(up, dir.clone().normalize());
    m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, dir.length(), 1));
    seams.setMatrixAt(i, m);
  });
  group.add(seams);
  return group;
}

/** A ring of alternating long and short thorns, in the sigil style. */
export function createThornRing(radius: number, thorns = 28): THREE.Group {
  const group = new THREE.Group();
  const chrome = CHROME();
  group.add(new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.008, 8, 160), chrome));
  const long = new THREE.ConeGeometry(radius * 0.016, radius * 0.24, 4);
  const short = new THREE.ConeGeometry(radius * 0.012, radius * 0.1, 4);
  for (let i = 0; i < thorns; i++) {
    const angle = (i / thorns) * Math.PI * 2;
    const isLong = i % 2 === 0;
    const length = radius * (isLong ? 0.24 : 0.1);
    // Long thorns point outwards, short ones inwards
    const dir = isLong ? 1 : -1;
    const thorn = new THREE.Mesh(isLong ? long : short, chrome);
    const r = radius + (dir * length) / 2;
    thorn.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
    thorn.rotation.z = angle - (dir * Math.PI) / 2;
    group.add(thorn);
  }
  return group;
}

/** Extruded gothic cross with flared, pointed arms. */
export function createCross(size = 1): THREE.Mesh {
  const arm = (len: number): [number, number][] => [
    [-0.09, 0.09], [-0.07, len * 0.55], [-0.2, len * 0.82], [0, len], [0.2, len * 0.82], [0.07, len * 0.55], [0.09, 0.09],
  ];
  const rotate = ([x, y]: [number, number], quarter: number): [number, number] =>
    quarter === 0 ? [x, y] : quarter === 1 ? [y, -x] : quarter === 2 ? [-x, -y] : [-y, x];
  // Up, right, down (longer stem), left; traced clockwise
  const lengths = [0.75, 0.55, 1.15, 0.55];
  const outline = lengths.flatMap((len, quarter) => arm(len).map((p) => rotate(p, quarter)));

  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x * size, y * size) : shape.lineTo(x * size, y * size)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07 * size, bevelEnabled: true, bevelThickness: 0.035 * size, bevelSize: 0.03 * size, bevelSegments: 3,
  });
  geometry.center();
  return new THREE.Mesh(geometry, CHROME());
}

/** A spiked crown: band, five tall points, jewels in the accent colour. */
export function createCrown(radius = 1): THREE.Group {
  const group = new THREE.Group();
  const chrome = CHROME();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, radius * 0.28, 48, 1, true), chrome);
  (band.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  group.add(band);
  for (const y of [-0.14, 0.14]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * (y < 0 ? 0.92 : 1), radius * 0.035, 8, 64), chrome);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y * radius;
    group.add(rim);
  }
  const jewel = new THREE.MeshStandardMaterial({ color: BLOOD, emissive: BLOOD, emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.2 });
  const points = 10;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const tall = i % 2 === 0;
    const height = radius * (tall ? 0.85 : 0.42);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(radius * (tall ? 0.13 : 0.09), height, 4), chrome);
    spike.position.set(Math.cos(angle) * radius, radius * 0.14 + height / 2, Math.sin(angle) * radius);
    spike.rotation.y = -angle;
    group.add(spike);
    if (tall) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.075), jewel);
      gem.position.set(Math.cos(angle) * radius * 1.03, 0, Math.sin(angle) * radius * 1.03);
      group.add(gem);
    }
  }
  return group;
}

/** Wireframe football pitch (105 × 68 proportions) lying in the XZ plane. */
export function createPitchLines(length = 105, width = 68, color = 0xc9ccd6, opacity = 0.5): THREE.LineSegments {
  const L = length / 2;
  const W = width / 2;
  const segments: number[] = [];
  const line = (x1: number, z1: number, x2: number, z2: number) => segments.push(x1, 0, z1, x2, 0, z2);
  const rect = (x1: number, z1: number, x2: number, z2: number) => {
    line(x1, z1, x2, z1); line(x2, z1, x2, z2); line(x2, z2, x1, z2); line(x1, z2, x1, z1);
  };
  const arc = (cx: number, cz: number, r: number, from: number, to: number, steps = 40) => {
    for (let i = 0; i < steps; i++) {
      const a = from + ((to - from) * i) / steps;
      const b = from + ((to - from) * (i + 1)) / steps;
      line(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r);
    }
  };
  rect(-L, -W, L, W);
  line(0, -W, 0, W);
  arc(0, 0, 9.15, 0, Math.PI * 2, 64);
  for (const side of [-1, 1]) {
    const goal = side * L;
    rect(goal, -20.16, goal - side * 16.5, 20.16); // penalty area
    rect(goal, -9.16, goal - side * 5.5, 9.16); // six-yard box
    rect(goal, -3.66, goal + side * 2, 3.66); // goal
    const spot = goal - side * 11;
    const half = Math.acos(5.5 / 9.15);
    arc(spot, 0, 9.15, side === 1 ? Math.PI - half : -half, side === 1 ? Math.PI + half : half, 20);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

export function createDust(count: number, spread: [number, number, number], color = 0xc9ccd6, size = 0.05): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread[0];
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7, sizeAttenuation: true, depthWrite: false }));
}
