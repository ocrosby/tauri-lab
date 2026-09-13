# Security

Tauri 2 replaces v1's global `allowlist` with a fine-grained **capability** system. This document explains the pieces.

## Threat model

Tauri assumes:

- **The webview is untrusted.** Even code you wrote could be compromised via XSS from a dependency, a malicious ad, or a supply-chain attack in your CSS.
- **The OS is trusted.** You wrote the Rust code. The OS APIs you call do what they say.

The IPC boundary is where you enforce that trust asymmetry. Every capability granted is a hole the webview can reach through — keep the set minimal.

## Capabilities

A **capability** is a JSON file that grants a set of **permissions** to a set of **windows**. Files live in `src-tauri/capabilities/*.json`.

Minimum viable capability:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Baseline permissions for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

- **`identifier`** — unique per file
- **`windows`** — array of window labels (from `tauri.conf.json`) this capability applies to; supports glob patterns (`"main-*"`)
- **`permissions`** — array of permission identifiers

Multiple capability files are additive — a window's granted permissions are the union of every capability that lists it.

## Permissions

A permission identifier is `<plugin>:<permission-name>`. The `core:` namespace covers built-in APIs; each plugin defines its own namespace.

### Built-in (`core:*`)

`core:default` is a bundle that includes the minimum needed for a Tauri window to function: `core:webview:allow-*`, `core:window:allow-*`, `core:event:*`, `core:path:*`, etc.

Explicit examples if you want to be pickier:

- `core:window:allow-close` — allow JS to close the window
- `core:window:allow-minimize`
- `core:event:allow-emit` — allow JS `emit()`
- `core:event:allow-listen` — allow JS `listen()`

### Plugin permissions

Each first-party plugin publishes its own. Examples used in this repo:

**`tauri-plugin-fs`:**
- `fs:default` — bundle of read/write on the app data dir
- `fs:allow-read-text-file` — narrower: read text files
- `fs:allow-write-text-file`
- `fs:scope-appdata-recursive` — scope prefix limiting paths

**`tauri-plugin-dialog`:**
- `dialog:default`
- `dialog:allow-open`
- `dialog:allow-save`
- `dialog:allow-message`

**`tauri-plugin-notification`:**
- `notification:default`
- `notification:allow-notify`
- `notification:allow-request-permission`

**`tauri-plugin-http`:**
- `http:default`
- `http:allow-fetch`
- Scoped URLs go in the plugin's own scope object

## Scopes

Some permissions are **scoped** — they narrow the resources the permission applies to. Filesystem is the canonical example:

```json
{
  "identifier": "read-app-data",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "fs:allow-read-text-file",
      "allow": [{ "path": "$APPDATA/*.json" }]
    }
  ]
}
```

Without the `allow` scope, the permission wouldn't grant read access to anything. With it, the webview can read `*.json` files inside the app's data directory — and nothing else.

HTTP is similar:

```json
{
  "permissions": [
    "http:default",
    {
      "identifier": "http:allow-fetch",
      "allow": [{ "url": "https://api.example.com/*" }]
    }
  ]
}
```

## Path variables

Filesystem scopes accept these variables (expanded per-OS):

- `$APPDATA` — app-specific data directory
- `$APPCONFIG` — app-specific config directory
- `$APPCACHE`
- `$APPLOG`
- `$HOME`
- `$DOCUMENT`, `$DOWNLOAD`, `$DESKTOP`, `$PICTURE`, `$VIDEO`, `$AUDIO`
- `$TEMP`

Prefer `$APPDATA` over `$HOME` — it limits blast radius if the webview is compromised.

## Content Security Policy (CSP)

Configured in `tauri.conf.json`:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

Tauri prepends its own required directives to whatever you specify. Setting `"csp": null` disables CSP entirely — do that only for demos where you understand the trade-off. In this repo, most demos set `"csp": null` for readability; a production app should set a real CSP.

## Rules for a real app

1. **Start with `core:default` and add.** Never widen from a permissive default; narrow from `core:default` upward.
2. **Scope every filesystem and network permission.** An unscoped `fs:allow-read-text-file` means the webview can read any file the user can. That's rarely what you want.
3. **One capability per window role.** If windows have different privilege levels (main app window vs. login window vs. child popup), give each its own capability file.
4. **Never expose `shell:allow-execute` to the webview.** If you need to run a subprocess, do it inside a `#[tauri::command]` where you control the exact command and arguments.
5. **Set a real CSP.** `"csp": null` is a demo shortcut, not a production choice.
6. **Audit the permission list at review time.** A PR that adds a permission is a PR that widens the attack surface. Require justification.

## Reviewing a capability file

Ask, for every entry:

- What command in `lib.rs` needs this?
- What's the minimum scope that lets that command work?
- If I remove this permission, does anything the user does break?

If the answer to the last question is "no," delete it.

## Further reading

- [Tauri capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri permissions](https://v2.tauri.app/security/permissions/)
- [Tauri scope](https://v2.tauri.app/security/scope/)
