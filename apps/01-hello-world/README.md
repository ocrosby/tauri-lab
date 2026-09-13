# 01 — hello-world

**Teaches**: the anatomy of a minimal Tauri 2 app — HTML frontend calling a Rust `#[tauri::command]`.

## What it does

Opens a 600×400 window with a button. Click the button; the frontend calls a Rust function; the button label updates with the string Rust returned.

## Run

```bash
cargo tauri dev
```

First build takes 5–15 minutes (compiling Tauri and its deps). Later builds are seconds.

## Read the code in this order

1. **`src-tauri/tauri.conf.json`** — bundle metadata, window shape, and `withGlobalTauri: true` (this is what exposes `window.__TAURI__` to plain JS)
2. **`src-tauri/src/main.rs`** — three lines: hides the console on Windows release builds, then calls `lib::run()`
3. **`src-tauri/src/lib.rs`** — the actual app. Defines a `#[tauri::command]`, registers it with the builder, runs the event loop.
4. **`src-tauri/capabilities/default.json`** — grants `core:default` to the `main` window. Without this, the frontend can't invoke commands.
5. **`src/index.html`** — a button and a paragraph
6. **`src/main.js`** — calls `invoke('greet')` and updates the DOM

## What to notice

- No `node_modules`. No frontend build step. The `src/` directory is served as-is.
- The `main.rs` / `lib.rs` split is Tauri 2's convention for mobile compatibility — the `#[cfg_attr(mobile, tauri::mobile_entry_point)]` on `run()` in `lib.rs` is what enables iOS/Android targets to link against the same code.
- The command's Rust name (`greet`) is used verbatim on the JS side as the first argument to `invoke()`.

## Try changing

- Return a `Result<String, String>` from `greet()`. Wrap the JS call in `try/catch`.
- Add a second command that accepts a name argument. Watch the [camelCase gotcha](../../docs/troubleshooting.md#command-returns-null-unexpectedly).
- Set `"withGlobalTauri": false` in `tauri.conf.json` and see the frontend break — you'd then need to import `@tauri-apps/api` on the JS side.
