# 04 — filesystem-dialog

**Teaches**: how Tauri **plugins** and **scoped permissions** work. Uses `tauri-plugin-fs` (file I/O) and `tauri-plugin-dialog` (native open/save picker).

## What it does

A tiny scratchpad:

- **Open** — native file picker; loads the selected `.txt` file into the textarea
- **Save** — native save dialog; writes the textarea contents to the chosen path
- **Save to app data** — writes `scratch.txt` to Tauri's app-data directory (`$APPDATA/com.tauri-lab.filesystem-dialog/`) — no dialog required, because the capability grants scoped write access to that directory
- **Load from app data** — reads it back

The point of the last two is to show the difference between:

- **Wide-scope permission** — needs a user gesture (a dialog picks the path)
- **Narrow-scope permission** — no gesture needed, but the app can only touch a specific pre-declared directory

## Run

```bash
cargo tauri dev
```

## Read the code in this order

1. **`src-tauri/Cargo.toml`** — note the two new dependencies: `tauri-plugin-fs` and `tauri-plugin-dialog`
2. **`src-tauri/src/lib.rs`** — the `.plugin(...)` calls that register them. No custom `#[tauri::command]` — the plugins expose all the commands the frontend needs.
3. **`src-tauri/capabilities/default.json`** — **this is the interesting file**. Read the permission list carefully:
   - `dialog:default` — open/save dialogs
   - `fs:allow-read-text-file` + `fs:allow-write-text-file` — plain text I/O
   - A **scoped** `fs:scope-appdata-recursive` entry — restricts the "no-dialog" writes to `$APPDATA/`
4. **`src/main.js`** — calls the plugins via `window.__TAURI__.dialog` and `window.__TAURI__.fs`

## Key patterns

### Adding a plugin

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    // ...
```

### Calling a plugin from JS

```js
const { open, save } = window.__TAURI__.dialog;
const { readTextFile, writeTextFile, BaseDirectory } = window.__TAURI__.fs;

// Native file picker
const path = await open({ filters: [{ name: "Text", extensions: ["txt"] }] });

// Read a file the user picked (wide permission, no scope needed because the
// dialog counts as the user gesture that grants access to this specific path)
const contents = await readTextFile(path);

// Write to app data (narrow permission — no dialog because scope allows it)
await writeTextFile("scratch.txt", "hello", { baseDir: BaseDirectory.AppData });
```

### Scoping filesystem permissions

In `capabilities/default.json`:

```json
{
  "permissions": [
    "fs:allow-write-text-file",
    {
      "identifier": "fs:scope-appdata-recursive",
      "allow": [{ "path": "$APPDATA/**" }]
    }
  ]
}
```

Without the scope entry, `writeTextFile("scratch.txt", ...)` fails even though `fs:allow-write-text-file` is granted. The permission says "this method is callable"; the scope says "these paths are reachable."

## Try changing

- Remove `fs:scope-appdata-recursive` from the capability. **Save to app data** now fails with a scope error — check the devtools console.
- Add `"$HOME/tauri-lab-test/**"` to the scope. Now the app can write to that directory without a dialog.
- Add `dialog:allow-message` and pop a native "saved!" alert with `message()` after successful writes.
