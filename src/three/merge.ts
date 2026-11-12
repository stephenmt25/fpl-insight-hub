import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** A copy of `geometry` moved into another space, cut down to the attributes every part is sure to have. */
function flatten(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const copy = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  for (const name of Object.keys(copy.attributes)) {
    if (name !== "position" && name !== "normal" && name !== "uv") copy.deleteAttribute(name);
  }
  if (!copy.getAttribute("normal")) copy.computeVertexNormals();
  if (!copy.getAttribute("uv")) copy.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(copy.getAttribute("position").count * 2), 2));
  copy.applyMatrix4(matrix);
  return copy;
}

/**
 * Collapses the static meshes under `root` into one mesh per material.
 *
 * Every mesh is a draw call, and the browser pays for each one on every
 * frame, so a tower built from a hundred small parts is far dearer than its
 * triangle count suggests. Baked, it costs one call per material.
 *
 * Left alone: instanced meshes, hidden objects, anything flagged
 * `userData.live` (it moves or is switched on and off), and whatever `keep`
 * claims, along with everything beneath it.
 */
export function bake(root: THREE.Object3D, keep: (object: THREE.Object3D) => boolean = () => false) {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const parts = new Map<THREE.Material, { mesh: THREE.Mesh; geometry: THREE.BufferGeometry }[]>();
  const matrix = new THREE.Matrix4();

  const visit = (object: THREE.Object3D) => {
    if (object !== root && (!object.visible || object.userData.live || keep(object))) return;
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && !(mesh as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(mesh.material) && mesh.children.length === 0) {
      matrix.multiplyMatrices(toRoot, mesh.matrixWorld);
      // A mirrored part would come out inside-out; nothing here is mirrored, so leave any such mesh as it is
      if (matrix.determinant() > 0) {
        const list = parts.get(mesh.material) ?? [];
        list.push({ mesh, geometry: flatten(mesh.geometry, matrix) });
        parts.set(mesh.material, list);
      }
    }
    object.children.forEach(visit);
  };
  visit(root);

  for (const [material, list] of parts) {
    if (list.length < 2) continue; // already a single draw call
    const merged = mergeGeometries(list.map((part) => part.geometry));
    if (!merged) continue;
    list.forEach((part) => part.mesh.removeFromParent());
    root.add(new THREE.Mesh(merged, material));
  }
}
