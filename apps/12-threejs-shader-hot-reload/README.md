# 12 — threejs-shader-hot-reload

**Teaches**: pairing a **Rust file watcher** with a Three.js **ShaderMaterial** so that saving a GLSL file on disk recompiles the shader live in the running app. This is the single most Tauri-specific demo in the repo — you cannot do this in a plain web page.

## What it does

- Displays a full-screen quad rendered with a custom `ShaderMaterial`
- Rust watches `src/shader.frag` using the `notify` crate
- On save, Rust reads the new source and emits a `shader-changed` event with the payload
- The frontend swaps the material's `fragmentShader` and sets `needsUpdate = true` — Three.js recompiles on the next frame
- A HUD shows the last reload timestamp

**Try it live**: run the demo, open `apps/12-threejs-shader-hot-reload/src/shader.frag` in your editor, change any value, save. The window updates instantly.

## Run

```bash
cargo tauri dev
```

Then edit `src/shader.frag` in any editor.

## Read the code in this order

1. **`src/shader.frag`** — the source of truth. Uniforms available: `u_time` (seconds since load), `u_resolution` (canvas pixel size).
2. **`src-tauri/Cargo.toml`** — note `notify-debouncer-mini`. Debouncing matters because many editors save by write-to-temp + rename, generating a burst of events.
3. **`src-tauri/src/lib.rs`**:
   - `.setup(...)` spawns a debouncer thread watching the shader file
   - `#[tauri::command] fn get_shader` returns the current source (frontend calls this on load)
   - On file change: emit `shader-changed` with the new source as payload
4. **`src/main.js`** — subscribes to the event, swaps `material.fragmentShader`, flips `needsUpdate = true`

## Key patterns

### Watching a file with debouncing

```rust
use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode};

let (tx, rx) = std::sync::mpsc::channel();
let mut debouncer = new_debouncer(std::time::Duration::from_millis(150), tx)?;
debouncer.watcher().watch(&path, RecursiveMode::NonRecursive)?;

std::thread::spawn(move || {
    for events in rx.iter().flatten() {
        for e in events {
            if e.path == path {
                if let Ok(src) = std::fs::read_to_string(&path) {
                    let _ = app_handle.emit("shader-changed", src);
                }
            }
        }
    }
});
```

### Recompiling a ShaderMaterial

```js
const { listen } = window.__TAURI__.event;

await listen("shader-changed", (event) => {
  material.fragmentShader = event.payload;
  material.needsUpdate = true;
});
```

That's the entire hot-reload API. Three.js recompiles on the next `render()`.

### Path resolution — dev vs release

The demo watches `<manifest>/../src/shader.frag`, where `<manifest>` comes from `env!("CARGO_MANIFEST_DIR")`. That resolves at compile time and points at the source tree — perfect for `cargo tauri dev`. In a **release build** the source tree may not exist on the user's machine, so the watcher would silently fail. This is intentional for a demo. A production hot-reloading tool would put the shader file in `$APPDATA` or bundle it as a resource.

## Try changing

- Edit `src/shader.frag` to change the color palette (`cos(u_time + v_uv.xyx + vec3(0.0, 2.0, 4.0))`).
- Add a `uniform vec2 u_mouse` on both sides — write JS mouse position to the uniform every frame, read it in GLSL.
- Watch **multiple** files (`shader.vert` too) — one debouncer per file, two events.
- Emit a `shader-error` event when compilation fails (`renderer.getContext().getError()` after render) and show it in the HUD.
