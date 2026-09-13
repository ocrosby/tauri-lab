# Troubleshooting

## Build errors

### `error: linker 'cc' not found` (Linux)

Missing build essentials:

```bash
sudo apt install build-essential
```

### `error: failed to run custom build command for 'webkit2gtk-sys'` (Linux)

Missing WebKit headers:

```bash
sudo apt install libwebkit2gtk-4.1-dev
```

Some distros still ship the older 4.0 version. If 4.1 isn't in your package manager, use 4.0 and set:

```bash
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig
```

### `error: Microsoft Visual C++ 14.0 or greater is required` (Windows)

Install Visual Studio Build Tools with the "Desktop development with C++" workload.

### First build hangs at `Compiling webkit2gtk-sys`

Not hung — this crate takes 3–8 minutes on first build. Grab coffee. `cargo build --verbose` if you want to see it's still working.

### `cargo tauri: command not found`

The CLI isn't installed, or `~/.cargo/bin` isn't on your PATH:

```bash
cargo install tauri-cli --version "^2.0.0" --locked
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc  # or ~/.bashrc
```

## Runtime errors

### `Permission '<name>' not found`

Add the permission to `src-tauri/capabilities/default.json`. Check spelling — plugin permissions look like `fs:allow-read-text-file`, not `fs::allow-read-text-file` or `allow-fs-read`.

### `window.__TAURI__ is undefined`

Missing `"withGlobalTauri": true` in `tauri.conf.json`. Every demo in this repo has it — check yours.

### Command returns `null` unexpectedly

Argument names on the JS side must match the Rust parameter names **exactly**, including case. Tauri deserializes camelCase by default:

```rust
// Rust
#[tauri::command]
fn greet(user_name: &str) -> String { ... }
```

```js
// JS — WRONG, will pass undefined
await invoke('greet', { user_name: 'Alice' });

// JS — RIGHT
await invoke('greet', { userName: 'Alice' });
```

Override with `#[tauri::command(rename_all = "snake_case")]` if you prefer snake_case on both sides.

### `Error: window not found`

You called `app.get_webview_window("label")` where no window has that label. Window labels come from `tauri.conf.json` (`app.windows[].label`) or from `WebviewWindowBuilder::new(app, "label", ...)`.

### `Failed to load resource: net::ERR_FILE_NOT_FOUND`

The frontend file isn't where `tauri.conf.json` says it is. Check `build.frontendDist` — it's relative to the `src-tauri/` directory, so `../src` in this repo.

### JS `fetch()` blocked or CORS error

The webview can't `fetch()` arbitrary URLs by default. Two options:

1. **Use the `http` plugin** — see `apps/07-http-plugin`. Requests go through Rust, no CORS.
2. **Configure CSP** — add the origin to `app.security.csp` in `tauri.conf.json`.

## Icon errors

### `Failed to open icon at src-tauri/icons/icon.png`

Icons aren't committed. Generate them:

```bash
./scripts/generate-icons.sh
```

Or use Tauri's own generator:

```bash
cd apps/NN-name
cargo tauri icon path/to/source-1024x1024.png
```

## Editor / IDE

### Rust-analyzer doesn't work

Point it at the demo's `src-tauri/Cargo.toml`:

```json
// .vscode/settings.json (per demo, or configure at workspace level)
{
  "rust-analyzer.linkedProjects": [
    "apps/01-hello-world/src-tauri/Cargo.toml",
    "apps/02-ipc-commands/src-tauri/Cargo.toml"
  ]
}
```

### `unresolved import 'tauri'`

Run `cargo build` once in the demo's `src-tauri/` directory. rust-analyzer needs the dependency graph to exist on disk.

## Common footguns

- **Mutex held across `.await`** — use `tokio::sync::Mutex`, not `std::sync::Mutex`, when the lock spans async boundaries. Otherwise you'll deadlock or panic.
- **Emitting events from a synchronous command with a slow listener** — the emit is buffered but the JS listener might not have registered yet if it runs *after* the invoke. Register listeners before invoking commands that emit.
- **Modifying `tauri.conf.json` while `cargo tauri dev` is running** — config changes require a full restart. The Rust hot-reload only picks up `.rs` files.
- **Calling `invoke()` before `window.__TAURI__` is defined** — wrap in `document.addEventListener('DOMContentLoaded', ...)` or check `window.__TAURI__` exists first.

## Getting help

- Tauri Discord: https://discord.com/invite/tauri
- Tauri GitHub Discussions: https://github.com/tauri-apps/tauri/discussions
- This repo: open an issue at https://github.com/ocrosby/tauri-lab/issues
