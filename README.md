# tauri-lab

A hands-on learning lab for [Tauri 2](https://v2.tauri.app/), organized as a set of small, focused demo apps. Each demo isolates one Tauri capability so you can read a few dozen lines and understand exactly how the piece works — no framework noise, no build-tool ceremony, no `node_modules`.

Every demo uses a **plain HTML + vanilla JavaScript frontend** and talks to a **Rust backend** via Tauri's IPC. Nothing is bundled, transpiled, or minified.

## Table of contents

- [Why tauri-lab](#why-tauri-lab)
- [Demos](#demos)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Repository layout](#repository-layout)
- [Documentation](#documentation)
- [Running a demo](#running-a-demo)
- [Building a demo for release](#building-a-demo-for-release)
- [Learning path](#learning-path)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Why tauri-lab

Most Tauri examples in the wild fall into one of two traps:

1. **Framework-heavy starters** — React + Vite + TypeScript + Tailwind on the frontend, plus a plugin soup on the backend. It works, but the Tauri part is 10% of what you're reading.
2. **Docs-only snippets** — you learn the API surface but never see a runnable app end-to-end.

This repo splits the difference. Each demo is a **complete, runnable Tauri app** that demonstrates **one capability** with **no framework overhead**. Read the source, run it, and move on.

## Demos

**Core Tauri capabilities**

| # | Demo | What it teaches |
|---|------|-----------------|
| 01 | [`apps/01-hello-world`](apps/01-hello-world) | Minimal Tauri 2 project: HTML frontend calling a Rust `#[tauri::command]` |
| 02 | [`apps/02-ipc-commands`](apps/02-ipc-commands) | Sync/async commands, arguments, return values, managed state |
| 03 | [`apps/03-events`](apps/03-events) | Bidirectional event bus: JS↔Rust `emit`/`listen` |
| 04 | [`apps/04-filesystem-dialog`](apps/04-filesystem-dialog) | File system + dialog plugins with scoped permissions |
| 05 | [`apps/05-window-management`](apps/05-window-management) | Multiple windows, custom titlebar, positioning |
| 06 | [`apps/06-tray-notifications`](apps/06-tray-notifications) | System tray icon + menu + native OS notifications |
| 07 | [`apps/07-http-plugin`](apps/07-http-plugin) | HTTP requests from Rust via the `http` plugin |

**Three.js integration** (WebGL rendered inside the Tauri webview; Three.js is vendored at `src/vendor/three/`)

| # | Demo | What it teaches |
|---|------|-----------------|
| 08 | [`apps/08-threejs-basics`](apps/08-threejs-basics) | Scene / camera / renderer / render loop — the Three.js "hello world" |
| 09 | [`apps/09-threejs-lighting-materials`](apps/09-threejs-lighting-materials) | PBR materials, three light types, shadow mapping, OrbitControls |
| 10 | [`apps/10-threejs-model-viewer`](apps/10-threejs-model-viewer) | Load glTF/GLB via the native file picker (`dialog` + `fs` plugins → `GLTFLoader.parseAsync`) |
| 11 | [`apps/11-threejs-instancing`](apps/11-threejs-instancing) | `InstancedMesh` — 100 k objects in one draw call |
| 12 | [`apps/12-threejs-shader-hot-reload`](apps/12-threejs-shader-hot-reload) | Rust `notify` file-watcher → live-recompile a `ShaderMaterial` on save |

Each demo has its own `README.md` explaining what it does and how to run it.

## Prerequisites

Tauri 2 needs a working Rust toolchain and platform-specific native dependencies. The [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/) is the authoritative source. Short version:

- **All platforms**: Rust (via `rustup`) — `stable` channel
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: WebKitGTK, `build-essential`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` (exact packages vary by distro)
- **Windows**: Microsoft Visual Studio C++ Build Tools, WebView2 (bundled on Windows 10 1803+)

Then install the Tauri CLI globally via Cargo:

```bash
cargo install tauri-cli --version "^2.0.0" --locked
```

That's it. **No Node.js required to run these demos** — the frontends are static HTML.

Optional: if you want to regenerate app icons, install [ImageMagick](https://imagemagick.org/) and run `scripts/generate-icons.sh`.

## Quick start

```bash
git clone https://github.com/ocrosby/tauri-lab.git
cd tauri-lab
./scripts/generate-icons.sh          # one-time: generate placeholder icons for all demos
cd apps/01-hello-world
cargo tauri dev
```

The first build downloads and compiles a lot of Rust crates (WebKit bindings, serialization, etc.). Expect **5–15 minutes** on the first `cargo tauri dev`. Subsequent builds are seconds.

## Repository layout

```
tauri-lab/
├── README.md                      # you are here
├── CLAUDE.md                      # guidance for AI assistants working in this repo
├── LICENSE                        # MIT
├── CONTRIBUTING.md                # how to add a new demo
├── docs/                          # deeper reference material
│   ├── getting-started.md
│   ├── architecture.md
│   ├── ipc-commands.md
│   ├── security.md
│   ├── packaging.md
│   └── troubleshooting.md
├── apps/                          # one directory per demo
│   ├── 01-hello-world/
│   ├── 02-ipc-commands/
│   ├── 03-events/
│   ├── 04-filesystem-dialog/
│   ├── 05-window-management/
│   ├── 06-tray-notifications/
│   ├── 07-http-plugin/
│   ├── 08-threejs-basics/         # Three.js demos vendor three.module.min.js
│   ├── 09-threejs-lighting-materials/
│   ├── 10-threejs-model-viewer/
│   ├── 11-threejs-instancing/
│   └── 12-threejs-shader-hot-reload/
├── scripts/
│   └── generate-icons.sh          # produces placeholder icons for every demo
└── shared/
    └── icons/                     # source-of-truth icon set (referenced by demos)
```

Each demo directory has the same shape:

```
apps/NN-name/
├── README.md                      # what this demo teaches
├── src/                           # frontend (plain HTML/JS/CSS)
│   ├── index.html
│   ├── main.js
│   └── style.css
└── src-tauri/                     # Rust backend
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/
    │   └── default.json
    ├── icons/                     # symlinked or copied from shared/
    └── src/
        ├── main.rs
        └── lib.rs
```

## Documentation

Long-form notes live in `docs/`:

- **[Getting started](docs/getting-started.md)** — install the toolchain, run your first demo, understand what happened
- **[Architecture](docs/architecture.md)** — Tauri's process model: main vs webview, IPC boundary, permissions
- **[IPC commands](docs/ipc-commands.md)** — patterns for commands, events, and state
- **[Security](docs/security.md)** — CSP, capabilities/permissions, scoped plugins
- **[Packaging](docs/packaging.md)** — building signed installers for macOS, Windows, Linux
- **[Troubleshooting](docs/troubleshooting.md)** — common errors and fixes

## Running a demo

```bash
cd apps/NN-name/src-tauri
cargo tauri dev
```

Or, from the demo root:

```bash
cd apps/NN-name
cargo tauri dev
```

Both work — the Tauri CLI auto-detects `src-tauri/tauri.conf.json` from either location.

Hot-reload of the frontend works out of the box: edit `src/*.html` or `src/*.js`, and the webview reloads. Rust changes require a rebuild (the CLI does this automatically when you save a `.rs` file).

## Building a demo for release

```bash
cd apps/NN-name
cargo tauri build
```

Output lands in `src-tauri/target/release/bundle/`:

- **macOS**: `.app`, `.dmg`
- **Windows**: `.msi`, `.exe` (NSIS)
- **Linux**: `.deb`, `.AppImage`, `.rpm`

See [`docs/packaging.md`](docs/packaging.md) for signing and notarization.

## Learning path

Read the demos in order — each builds on concepts from the previous:

1. **01-hello-world** teaches the anatomy of a Tauri project.
2. **02-ipc-commands** shows how JS calls Rust with real arguments and shared state.
3. **03-events** covers the other direction: Rust pushing data to JS.
4. **04-filesystem-dialog** introduces **plugins** and the **permission model** (this is the Tauri 2 security story).
5. **05-window-management** covers multi-window apps and the difference between windows and webviews.
6. **06-tray-notifications** turns your app into a background utility.
7. **07-http-plugin** shows the modern replacement for the deprecated `reqwest`-through-`allowlist` pattern from Tauri 1.
8. **08-threejs-basics** starts the Three.js track — WebGL runs unchanged in Tauri's webview.
9. **09-threejs-lighting-materials** adds PBR materials, lights, and shadows.
10. **10-threejs-model-viewer** combines Three.js with the Tauri file picker — the "why not just a web page" demo.
11. **11-threejs-instancing** shows the native GPU performance ceiling.
12. **12-threejs-shader-hot-reload** wires a Rust file-watcher to a live-recompiling shader — impossible in a plain browser.

## Troubleshooting

See [`docs/troubleshooting.md`](docs/troubleshooting.md). The three most common issues:

- **"error: linker `cc` not found"** → install platform build tools (see [Prerequisites](#prerequisites))
- **First build hangs at "Compiling webkit2gtk-sys"** → not hung, just slow. Linux users: give it 5–10 minutes.
- **"Permission `fs:allow-read-file` not found"** → the capabilities file is missing or misspelled; see [`docs/security.md`](docs/security.md).

## Contributing

New demos welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the template and conventions. The bar is:

- Demonstrates **one** capability
- Runs with `cargo tauri dev` and nothing else (no `npm install`)
- Has a `README.md` explaining what to watch/click and what should happen

## License

MIT — see [`LICENSE`](LICENSE).

## Acknowledgments

- The [Tauri team](https://tauri.app/) for the framework and excellent docs
- The [`create-tauri-app`](https://github.com/tauri-apps/create-tauri-app) templates, which were the starting point for the project shape
- Everyone who has filed a "how do I…" issue on the Tauri repo — you shaped these demos more than you know
