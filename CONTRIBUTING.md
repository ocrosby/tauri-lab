# Contributing to tauri-lab

Thanks for wanting to add a demo. This repo has a strong shape — please read this first.

## What a good demo looks like

- **One capability per demo.** If your demo covers "windows and menus and tray," split it into three.
- **Runs with `cargo tauri dev` and nothing else.** No `npm install`, no build step for the frontend, no external services.
- **Plain HTML/JS/CSS frontend.** Vanilla only. No React, no Vue, no Tailwind. The point is that a reader can see the Tauri call directly, not through a framework abstraction.
- **Under ~200 lines of frontend code.** If it's bigger, you're teaching a UI pattern, not a Tauri feature.
- **Under ~300 lines of Rust.** Same reason.
- **Has a `README.md`** describing what to click and what should happen.

## Directory template

Copy `apps/01-hello-world/` and edit:

```
apps/NN-your-demo/
├── README.md
├── src/
│   ├── index.html
│   ├── main.js
│   └── style.css
└── src-tauri/
    ├── Cargo.toml            # unique package name
    ├── tauri.conf.json       # unique identifier (com.tauri-lab.your-demo)
    ├── build.rs
    ├── capabilities/
    │   └── default.json
    └── src/
        ├── main.rs
        └── lib.rs
```

## Numbering

Demos are numbered `NN-` to give the repo a suggested reading order. Pick the next available number, or renumber existing demos in a separate PR if you want to insert one in the middle.

## Icons

Every demo shares icons from `shared/icons/`. Run `./scripts/generate-icons.sh` after cloning to populate `apps/NN-*/src-tauri/icons/` with placeholder icons. Do **not** commit icon binaries per-demo — the script regenerates them.

## Commit / PR conventions

- Conventional Commits: `feat(apps): add 08-clipboard-plugin demo`
- One demo per PR
- The PR description should state which Tauri capability the demo isolates and link to the relevant page of the Tauri docs

## Testing your demo

Before opening a PR:

```bash
cd apps/NN-your-demo
cargo tauri dev        # runs?
cargo tauri build      # builds?
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## Docs

If your demo introduces a concept not yet covered in `docs/`, add a short section — don't create a new doc file unless the topic genuinely warrants one.
