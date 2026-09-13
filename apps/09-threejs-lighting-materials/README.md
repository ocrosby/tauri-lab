# 09 — threejs-lighting-materials

**Teaches**: PBR (physically-based) materials, three light types, and shadow-mapping.

## What it does

A slowly-rotating scene:

- A `MeshStandardMaterial` sphere with a metallic/rough surface — reacts to light like a real object
- A `MeshStandardMaterial` plane below acts as a ground receiving shadows
- Three lights:
  - **AmbientLight** — flat fill so nothing is fully black
  - **DirectionalLight** — a "sun" that casts hard shadows
  - **PointLight** — a colored bulb orbiting the sphere; casts soft-ish shadows
- OrbitControls let you drag to rotate the camera

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src/main.js`** — everything's in one file, sectioned by comment:
   - Renderer with `shadowMap` enabled — required for any light to cast shadows
   - Scene + camera + OrbitControls (imported from vendored addons)
   - Materials: `MeshStandardMaterial` uses the metallic-roughness workflow
   - Lights: which ones `.castShadow = true` and why the point light gets a different tuning
   - Meshes: `.castShadow` and `.receiveShadow` are per-mesh opt-in

## Key patterns

### Enabling shadows (three-step wiring)

```js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);      // sharper = larger map
sun.shadow.camera.left = -5;              // shadow camera frustum
sun.shadow.camera.right = 5;
sun.shadow.camera.top = 5;
sun.shadow.camera.bottom = -5;

sphere.castShadow = true;
plane.receiveShadow = true;
```

If shadows don't show up: **all three levels** must be on (renderer, light, mesh).

### PBR material params to try

| Param | Range | Effect |
|---|---|---|
| `color` | any | base color (also called *albedo* in some engines) |
| `metalness` | 0 – 1 | 0 = dielectric (plastic), 1 = metal |
| `roughness` | 0 – 1 | 0 = mirror, 1 = matte |
| `emissive` | any | color the material appears to emit; unaffected by light |
| `envMap` | Texture | environment reflection map |

### OrbitControls

```js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // inertia
controls.dampingFactor = 0.05;
```

Call `controls.update()` inside the render loop.

## Try changing

- Set the sphere's `metalness = 1.0, roughness = 0.1` — it turns into a chrome ball
- Add a second sphere with `emissive: 0x88ffcc, emissiveIntensity: 2` — it glows independent of light
- Replace `PointLight` with `SpotLight({ angle: 0.3, penumbra: 0.5 })` — flashlight look
- Load a `PMREMGenerator` HDR environment map for real reflections (`RGBELoader` from addons)
