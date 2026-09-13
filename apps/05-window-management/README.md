# 05 — window-management

**Teaches**: creating additional windows at runtime, custom titlebar controls (frameless window), positioning, and window-to-window communication via events.

## What it does

- Main window has a **frameless** titlebar (decorations off) with hand-rolled `× − □` buttons in HTML.
- **Open child window** — spawns a second `WebviewWindow` at runtime with a specific size, position, and label.
- **Ping child** — main sends an event to the child; the child shows the payload.
- **Move to top-left / center** — main window jumps to a fixed monitor position and re-centers.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src-tauri/tauri.conf.json`** — note `"decorations": false` on the main window. That removes the OS titlebar; we draw our own.
2. **`src-tauri/src/lib.rs`**:
   - `#[tauri::command] fn open_child(...)` builds a new `WebviewWindow` at runtime with `WebviewWindowBuilder`
   - `close_window`, `minimize_window`, `move_top_left`, `center_window` use `AppHandle::get_webview_window(label)` + the window's own methods
3. **`src/index.html`** — the custom titlebar. `data-tauri-drag-region` on an element makes it a draggable region for the OS.
4. **`src/main.js`** — wire buttons to commands and events
5. **`src/child.html`** — the second window's frontend, loaded from the same directory

## Key patterns

### Frameless window with custom titlebar

`tauri.conf.json`:

```json
{
  "windows": [{
    "label": "main",
    "decorations": false,
    "titleBarStyle": "Overlay",
    "hiddenTitle": true
  }]
}
```

HTML:

```html
<div class="titlebar" data-tauri-drag-region>
  <span class="title">My App</span>
  <div class="titlebar-buttons">
    <button id="min">−</button>
    <button id="max">□</button>
    <button id="close">×</button>
  </div>
</div>
```

### Creating a window at runtime

```rust
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn open_child(app: AppHandle) -> Result<(), String> {
    WebviewWindowBuilder::new(&app, "child", WebviewUrl::App("child.html".into()))
        .title("Child window")
        .inner_size(400.0, 300.0)
        .position(100.0, 100.0)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

### Talking to a specific window

```rust
use tauri::{AppHandle, Emitter, Manager};

app.emit_to("child", "ping-from-parent", "hi").ok();
```

## Try changing

- Add `"transparent": true` and a rounded-corner CSS rule for a floating-panel look (requires `macOSPrivateApi` on newer macOS builds — see Tauri docs).
- Make the child window `always_on_top(true)` and see it hover over other apps.
- Add a **third** window from inside the child window using `WebviewWindowBuilder::new(...)` invoked from a command in the child's JS.
