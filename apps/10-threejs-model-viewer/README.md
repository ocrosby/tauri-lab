# 10 — threejs-model-viewer

**Teaches**: loading a **user-picked** glTF/GLB model into a Three.js scene using the Tauri `dialog` + `fs` plugins. This is the "why Tauri + Three.js" demo — the file picker is native, not a browser file input, and the loader consumes raw bytes read by Rust.

## What it does

- **Open .glb / .gltf…** button pops the native file picker
- Reads the file **as bytes via `fs.readFile`**
- Parses via Three.js `GLTFLoader.parseAsync`
- Adds the model to the scene, auto-frames the camera on it, and enables OrbitControls
- Drops a HUD showing the file name and triangle count

## Run

```bash
cargo tauri dev
```

Need a `.glb` to test with? [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models) has hundreds. Small good ones to start:
- `2.0/Duck/glTF-Binary/Duck.glb` (~117 KB)
- `2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb` (~3.9 MB — great PBR + textures)

## Read the code in this order

1. **`src-tauri/capabilities/default.json`** — permissions: `dialog:allow-open` + `fs:allow-read-file`. **No scope** on the fs read because we only read the specific path the dialog handed us. That path came from a user gesture, which the plugin trusts.
2. **`src/main.js`**:
   - `open({ filters: [...] })` — native picker
   - `readFile(path)` — returns a `Uint8Array` of the file bytes
   - `loader.parseAsync(buffer.buffer, "")` — parses in-memory, no fetch
   - `frameObject(model)` — computes the scene bounding box and repositions the camera + controls target
3. **`src-tauri/src/lib.rs`** — trivial: just registers the plugins.

## Key patterns

### Reading a file the user picked

```js
const { open } = window.__TAURI__.dialog;
const { readFile } = window.__TAURI__.fs;
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const path = await open({
  multiple: false,
  filters: [{ name: "glTF", extensions: ["glb", "gltf"] }],
});
if (!path) return;
const bytes = await readFile(path);        // Uint8Array
const loader = new GLTFLoader();
const gltf = await loader.parseAsync(bytes.buffer, "");
scene.add(gltf.scene);
```

Note we use `parseAsync` (which takes an `ArrayBuffer`) instead of `load()` (which takes a URL). Since the bytes came through Rust, there is no URL — the loader parses in memory.

### Auto-framing an arbitrary model

```js
function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
  camera.position.copy(center).add(new THREE.Vector3(0, 0, distance * 1.6));
  controls.target.copy(center);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
}
```

## Why this is the Tauri combo demo

You could build a glTF viewer as a plain web page — but you'd have to use `<input type="file">`, which forces the user through a browser file picker with no path awareness. With Tauri:

- Native file picker (OS-provided, remembers recent paths)
- Rust reads the file (no browser file size limits)
- No CORS
- Later: watch a directory for new files, associate `.glb` extension with the app, drag-drop from Finder

## Dev-time auto-load (`?autoload=<path>`)

For scripted testing you can skip the file picker by passing a URL query param. Two ways to set it:

**Via `tauri.conf.json`** (persistent for that build):

```json
"windows": [{
  "label": "main",
  "url": "index.html?autoload=/tmp/tauri-lab-samples/Duck.glb"
}]
```

**From devtools** (one-shot, in the running window):

```js
location.search = "?autoload=/tmp/tauri-lab-samples/Duck.glb"
```

If the path doesn't exist or the read fails, the HUD shows `autoload failed: <error>` and the app is otherwise unchanged. Without the param, startup is a no-op — the demo behaves exactly as before.

## Try changing

- Add a **drag-and-drop** handler: `document.body.addEventListener("drop", ...)` with `event.dataTransfer.files`. The file has a `path` field in Tauri.
- Support `.gltf` (JSON + separate `.bin` and textures) by passing a `manager` with a custom URL resolver that reads sibling files via `readFile`.
- Add a "Load HDR environment" button using `RGBELoader` from `three/addons/loaders/RGBELoader.js` for realistic reflections on the model.
