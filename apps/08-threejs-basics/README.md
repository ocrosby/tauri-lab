# 08 — threejs-basics

**Teaches**: the Three.js "hello world" — scene, camera, renderer, geometry, mesh, and the render loop. First of the Three.js demos.

## What it does

A rotating multicolored cube on a dark background. That's it. The point is to establish the four Three.js primitives every later demo builds on.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src/vendor/three/`** — Three.js is vendored, not npm-installed. Every Three.js demo in this repo works the same way.
2. **`src/index.html`** — the **importmap** (`<script type="importmap">`) tells the browser that `import * as THREE from "three"` should resolve to the local vendor file. This is the modern browser-native way to consume Three.js without a bundler.
3. **`src/main.js`** — five ideas:
   - **Renderer** — `THREE.WebGLRenderer` wraps a `<canvas>` and issues WebGL calls
   - **Scene** — the container for everything to be drawn
   - **Camera** — `PerspectiveCamera` for a photorealistic projection; the fourth argument (`fov`, `aspect`, `near`, `far`) is standard
   - **Geometry + material → Mesh** — `BoxGeometry` + `MeshNormalMaterial` combine into a `Mesh` that gets added to the scene
   - **Render loop** — `renderer.setAnimationLoop(fn)` is the modern replacement for `requestAnimationFrame`; it also works on WebXR devices

## Key patterns

### Vendored Three.js via importmap

```html
<script type="importmap">
  {
    "imports": {
      "three": "./vendor/three/three.module.min.js"
    }
  }
</script>
<script type="module" src="main.js"></script>
```

```js
import * as THREE from "three";
```

### Minimum viable scene

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshNormalMaterial(),
);
scene.add(cube);

renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});
```

## Try changing

- Swap `BoxGeometry` for `TorusKnotGeometry(1, 0.3, 128, 32)`.
- Swap `MeshNormalMaterial` for `MeshBasicMaterial({ color: 0xff5533, wireframe: true })`.
- Add a `resize` listener that updates `camera.aspect`, calls `camera.updateProjectionMatrix()`, and resizes the renderer.
- Move on to `09-threejs-lighting-materials` where basic materials become PBR materials with lights.
