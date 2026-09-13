# 03 — events

**Teaches**: Tauri's bidirectional event bus. Rust pushing data to JS on its own schedule; JS pushing data back.

## What it does

- **Progress bar** — click **Start**, Rust runs a "download" simulation in a background task and emits `download-progress` events every 40 ms for 2 seconds. The bar and percent update from event payloads.
- **Cancel** — clicking **Cancel** flips a shared atomic bool that the background task checks between ticks. Demonstrates the JS→Rust direction plus interior mutability without a `Mutex`.
- **Clock** — a separate background task emits `tick` every second on app startup, so you can see events flowing without any user interaction.

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src-tauri/src/lib.rs`**:
   - `Cancel(AtomicBool)` — shared flag using an atomic instead of a Mutex (`AtomicBool` is `Sync` without wrapping).
   - `tauri::async_runtime::spawn(...)` — spawns a background task from the `setup` hook and from a command.
   - `app.emit("event-name", payload)` — broadcast to every window.
   - `app.listen("event-name", |event| ...)` — subscribe on the Rust side.
2. **`src/main.js`**:
   - `listen("download-progress", (e) => ...)` — subscribe. Returns an `unlisten` function you can call to detach.
   - `emit("cancel-download", null)` — push to Rust.
   - `once("done", ...)` — one-shot listener that auto-detaches after the first event.

## Key patterns

### Rust → JS with progress

```rust
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
async fn start_download(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        for i in 0..=100 {
            app.emit("download-progress", i).ok();
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
        app.emit("done", ()).ok();
    });
}
```

```js
const { listen } = window.__TAURI__.event;
await listen("download-progress", (e) => {
  bar.style.width = `${e.payload}%`;
});
```

### JS → Rust

```js
const { emit } = window.__TAURI__.event;
await emit("cancel-download", null);
```

```rust
use tauri::Listener;

app.listen("cancel-download", move |_event| {
    flag.store(true, Ordering::Relaxed);
});
```

## Try changing

- Emit to a specific window with `app.emit_to("main", ...)` instead of `app.emit(...)`.
- Register the listener with `once` instead of `listen` and see it auto-detach.
- Send a struct as payload — `#[derive(Clone, serde::Serialize)] struct Progress { pct: u8, eta_ms: u64 }` — and destructure `event.payload` on the JS side.
