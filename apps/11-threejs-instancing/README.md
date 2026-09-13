# 11 — threejs-instancing

**Teaches**: `InstancedMesh` — drawing tens of thousands of copies of one geometry in a single GPU draw call, with per-instance transforms and colors.

## What it does

100,000 tiny cubes arranged in a spinning 3D grid, each with a unique color that pulses over time. Held together by exactly **one** draw call per frame. Try dragging the count up in `main.js` — 500k is still comfortable on integrated graphics.

There's also a live FPS + draw-count HUD so you can see the render cost.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src/main.js`** — three ideas that make instancing work:
   - **One `BufferGeometry` + one `Material` + one `InstancedMesh(geo, mat, count)`** — the GPU allocates a single VBO large enough for `count` transforms
   - **`mesh.setMatrixAt(i, matrix4)`** — position/rotation/scale each instance
   - **`InstancedBufferAttribute` on `color`** — per-instance color without switching materials
   - After bulk-setting, `mesh.instanceMatrix.needsUpdate = true`

## Key patterns

### Static instancing (positions set once)

```js
import * as THREE from "three";

const N = 100_000;
const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
const mat = new THREE.MeshLambertMaterial();
const mesh = new THREE.InstancedMesh(geo, mat, N);

const dummy = new THREE.Object3D();
const color = new THREE.Color();

for (let i = 0; i < N; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
  );
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
  color.setHSL(i / N, 0.7, 0.5);
  mesh.setColorAt(i, color);
}
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
scene.add(mesh);
```

### Why this is fast

- **One draw call.** Non-instanced would be N calls. GPU driver overhead per draw dominates at N > ~1k on most hardware.
- **One material bind.** Instancing multiplexes per-instance attributes (matrix, color) through built-in shader hooks.
- **GPU-side layout.** The instance matrix is a `mat4` attribute the vertex shader reads directly.

### Draw-call HUD

Three.js reports render stats after every `renderer.render()`:

```js
renderer.info.render.calls    // draw calls
renderer.info.render.triangles
renderer.info.memory.geometries
```

## Try changing

- Bump `N` to `500_000`. On an M1 Air, still ~60 fps.
- Replace `BoxGeometry` with `IcosahedronGeometry(0.05, 0)` — same story, denser geometry per instance.
- Add per-frame updates: rotate each instance's matrix in the render loop. Now you're paying for CPU-side matrix updates too — watch the frame time.
- Use `MeshBasicMaterial` (no lighting) — will be even faster; compare fps.
