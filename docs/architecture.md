# Architecture

Tauri apps have two halves, running in different processes:

```
┌─────────────────────────────────────────┐
│  Main process (Rust)                    │
│  - App lifecycle, windows, menus, tray  │
│  - Managed state                        │
│  - Filesystem, network, OS APIs         │
│  - Plugin backends                      │
└──────────────────┬──────────────────────┘
                   │  IPC (message passing)
┌──────────────────┴──────────────────────┐
│  Webview process(es) (JS / HTML / CSS)  │
│  - UI rendering                         │
│  - User interaction                     │
│  - Business logic that doesn't need OS  │
└─────────────────────────────────────────┘
```

## Main process

Started by the OS when the user launches the app. It's a Rust binary linked against the Tauri runtime. Its `main.rs` calls `lib::run()`, which builds a `tauri::App` and hands control to the event loop.

Responsibilities:

- Own the app lifecycle (`setup`, `on_window_event`, `on_menu_event`)
- Create and manage `WebviewWindow`s
- Own long-lived state via `.manage(State { ... })`
- Register `#[tauri::command]` handlers
- Own filesystem handles, network connections, background tasks
- Load plugins (`.plugin(tauri_plugin_fs::init())`)

There is exactly **one** main process per app.

## Webview process

Chromium-style multi-process model: each `WebviewWindow` is a separate OS process running the platform's webview (WebKit on macOS/Linux, WebView2 on Windows). Isolated from the main process by an OS boundary — a crash in the webview does not take down the main process.

The webview loads your frontend (HTML/CSS/JS), served either from a dev server (Vite, etc.) or from static files bundled at build time. In this repo, we serve static files.

The webview has **no direct access to the OS**. It can't read files, spawn processes, or make network requests to arbitrary hosts. It can only:

- Do everything a browser can do (DOM, `fetch` to allowed origins, WebSockets, WebGL, etc.)
- Talk to the main process via Tauri's IPC

## The IPC boundary

This is the interesting part. There are two channels:

### Commands (JS → Rust, request/response)

Frontend:

```js
const { invoke } = window.__TAURI__.core;
const result = await invoke('my_command', { name: 'world' });
```

Backend:

```rust
#[tauri::command]
fn my_command(name: &str) -> String {
    format!("Hello, {name}!")
}
```

Every command call is a request/response cycle. Arguments and return values are serialized to JSON automatically via `serde`. Async commands work exactly the same way, but return a `Future` and can `.await` other async work.

### Events (bidirectional pub/sub)

Frontend:

```js
const { emit, listen } = window.__TAURI__.event;
await listen('progress', (event) => console.log(event.payload));
await emit('user-clicked', { button: 'save' });
```

Backend:

```rust
app.emit("progress", 42).unwrap();
app.listen("user-clicked", |event| {
    let payload: serde_json::Value = event.payload().into();
    println!("{payload:?}");
});
```

Events don't have a response. Use them when:

- Rust needs to push data to JS (progress updates, notifications)
- Multiple listeners might care about the same signal

## Managed state

The main process usually owns state that outlives any single command call. Tauri stores this in the `App`'s state map, keyed by type:

```rust
struct Counter(Mutex<i64>);

tauri::Builder::default()
    .manage(Counter(Mutex::new(0)))
    .invoke_handler(tauri::generate_handler![increment])
    .run(context)
    .unwrap();

#[tauri::command]
fn increment(state: tauri::State<Counter>) -> i64 {
    let mut n = state.0.lock().unwrap();
    *n += 1;
    *n
}
```

State is `Sync + Send + 'static`. Interior mutability via `Mutex`, `RwLock`, or `parking_lot` variants. See `apps/02-ipc-commands` for a runnable version.

## Plugins

A Tauri "plugin" is a Rust crate that:

1. Exposes commands (registered via the plugin's `init()`)
2. Ships a JS module for the frontend to call those commands
3. Optionally declares permission scopes

Built-in first-party plugins in this repo:

- `tauri-plugin-fs` — filesystem access (`apps/04-filesystem-dialog`)
- `tauri-plugin-dialog` — native open/save dialogs (`apps/04-filesystem-dialog`)
- `tauri-plugin-notification` — OS notifications (`apps/06-tray-notifications`)
- `tauri-plugin-http` — HTTP client (`apps/07-http-plugin`)

Plugins are registered in `lib.rs`:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    // ...
```

And their frontend API is available under `window.__TAURI__.<plugin>` when `withGlobalTauri: true`.

## Permissions and capabilities

Tauri 2 changed the security model from v1's global "allowlist" to per-window **capabilities**. Every command a webview wants to call — including plugin commands — must be granted by a capability file.

Capability files live in `src-tauri/capabilities/*.json`. A minimal one for hello-world:

```json
{
  "identifier": "default",
  "description": "Capabilities for the main window",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

`core:default` grants the built-in commands needed to bootstrap (window controls, event bus, etc.). To add a plugin, list its permissions:

```json
{
  "permissions": [
    "core:default",
    "fs:allow-read-text-file",
    "dialog:allow-open"
  ]
}
```

See [`security.md`](security.md) for the full model.

## Build pipeline

```
cargo tauri dev
├── (optional) run frontend dev server if configured
├── cargo build the main binary
├── launch the binary
└── binary opens the webview pointing at devUrl or bundled files
```

```
cargo tauri build
├── (optional) run frontend build command
├── cargo build --release the main binary
├── package with the platform bundler (dmg, msi, deb, ...)
└── output to src-tauri/target/release/bundle/
```

## Why this shape

- **OS boundary between UI and privilege.** Even if an attacker gets JS execution in the webview (XSS), they still have to go through the IPC boundary to reach the OS. Every command they can call is enumerated in a capability file you own.
- **Rust owns the sensitive stuff.** File handles, network sockets, subprocess spawns — all managed in a language with strong types and no null.
- **Frontend can be anything.** Because the frontend is just a webview, you can ship a single-page app in any framework (or none, like this repo).
