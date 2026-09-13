# Getting started

This walks you from "just cloned the repo" to "the hello-world demo is running."

## 1. Install the Rust toolchain

If `rustc --version` doesn't work, install via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Choose the default install. Restart your shell.

## 2. Install platform native dependencies

Tauri renders its UI in the OS's native webview, so you need whatever library backs that webview.

### macOS

```bash
xcode-select --install
```

Nothing else. macOS ships with WebKit.

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Other distros: see the [Tauri Linux prerequisites page](https://v2.tauri.app/start/prerequisites/#linux) for exact package names.

### Windows

- Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — pick "Desktop development with C++"
- WebView2 is bundled on Windows 10 build 17763+ and Windows 11. Older builds: [install the Evergreen Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## 3. Install the Tauri CLI

```bash
cargo install tauri-cli --version "^2.0.0" --locked
```

This takes a couple of minutes. Verify:

```bash
cargo tauri --version
# tauri-cli 2.x.x
```

## 4. Generate the icons

Icons are gitignored (they're generated, not source of truth). Populate them once:

```bash
./scripts/generate-icons.sh
```

If you don't have ImageMagick installed, the script tells you what to do.

## 5. Run the hello-world demo

```bash
cd apps/01-hello-world
cargo tauri dev
```

**The first build takes 5–15 minutes.** Cargo is downloading and compiling hundreds of Rust crates (webkit bindings, serde, tokio, and everything Tauri depends on). You'll see a wall of `Compiling ...` lines. This is normal. Subsequent builds are seconds because everything's cached.

When it finishes, a native window opens. Click the button. You should see the message change from `Waiting...` to `Hello from Rust!`. That's a JavaScript function calling a Rust function and getting the string back.

## 6. What to do next

Read the demos in order:

1. `apps/01-hello-world` — you just ran this one
2. `apps/02-ipc-commands` — arguments, return values, shared state
3. `apps/03-events` — Rust pushing data to the frontend
4. `apps/04-filesystem-dialog` — the permission/capability model
5. `apps/05-window-management` — multi-window apps
6. `apps/06-tray-notifications` — background utilities
7. `apps/07-http-plugin` — making network requests from Rust

Then read [`architecture.md`](architecture.md) for the mental model that ties it all together.
