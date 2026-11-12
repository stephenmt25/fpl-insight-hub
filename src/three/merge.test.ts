import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { bake } from "./merge";

const stone = new THREE.MeshBasicMaterial();
const slate = new THREE.MeshBasicMaterial();
const box = () => new THREE.BoxGeometry(1, 1, 1);
const meshes = (root: THREE.Object3D) => {
  const found: THREE.Mesh[] = [];
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) found.push(o as THREE.Mesh); });
  return found;
};
const triangles = (mesh: THREE.Mesh) => mesh.geometry.getAttribute("position").count / 3;

describe("bake", () => {
  it("merges meshes that share a material, wherever they sit in the tree", () => {
    const root = new THREE.Group();
    const wing = new THREE.Group();
    wing.position.set(10, 0, 0);
    wing.add(new THREE.Mesh(box(), stone));
    root.add(new THREE.Mesh(box(), stone), new THREE.Mesh(box(), stone), wing, new THREE.Mesh(box(), slate), new THREE.Mesh(box(), slate));

    bake(root);

    const left = meshes(root);
    expect(left).toHaveLength(2);
    expect(left.map((m) => m.material)).toEqual(expect.arrayContaining([stone, slate]));
    expect(triangles(left.find((m) => m.material === stone)!)).toBe(36);
    expect(triangles(left.find((m) => m.material === slate)!)).toBe(24);
  });

  it("keeps every part where it was", () => {
    const root = new THREE.Group();
    root.position.set(100, 0, 0); // the root's own placement must not be baked in
    const wing = new THREE.Group();
    wing.position.set(10, 0, 0);
    wing.rotation.y = Math.PI / 2;
    const far = new THREE.Mesh(box(), stone);
    far.position.set(0, 5, 3);
    wing.add(far);
    root.add(new THREE.Mesh(box(), stone), wing);

    bake(root);

    const [merged] = meshes(root);
    merged.geometry.computeBoundingBox();
    const bounds = merged.geometry.boundingBox!;
    // One box round the origin, the other turned a quarter and moved to (13, 5, 0)
    expect(bounds.min.x).toBeCloseTo(-0.5);
    expect(bounds.max.x).toBeCloseTo(13.5);
    expect(bounds.max.y).toBeCloseTo(5.5);
    expect(bounds.min.z).toBeCloseTo(-0.5);
    expect(bounds.max.z).toBeCloseTo(0.5);
  });

  it("leaves alone whatever has to stay its own object", () => {
    const root = new THREE.Group();
    const loose = new THREE.Mesh(box(), stone);
    const live = new THREE.Mesh(box(), stone);
    live.userData.live = true;
    const hidden = new THREE.Mesh(box(), stone);
    hidden.visible = false;
    const instanced = new THREE.InstancedMesh(box(), stone, 3);
    const only = new THREE.Mesh(box(), slate);
    root.add(new THREE.Mesh(box(), stone), new THREE.Mesh(box(), stone), loose, live, hidden, instanced, only);

    bake(root, (object) => object === loose);

    const kept: THREE.Object3D[] = [loose, live, hidden, instanced, only];
    for (const object of kept) expect(object.parent).toBe(root);
    const merged = meshes(root).find((m) => m.material === stone && !kept.includes(m))!;
    expect(triangles(merged)).toBe(24);
  });

  it("copes with parts that lack normals or texture coordinates", () => {
    const root = new THREE.Group();
    const bare = new THREE.BufferGeometry();
    bare.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    root.add(new THREE.Mesh(bare, stone), new THREE.Mesh(box(), stone));

    bake(root);

    const [merged] = meshes(root);
    expect(triangles(merged)).toBe(13);
    expect(merged.geometry.getAttribute("normal").count).toBe(39);
    expect(merged.geometry.getAttribute("uv").count).toBe(39);
  });
});
