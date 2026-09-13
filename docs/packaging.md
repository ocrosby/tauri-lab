# Packaging

`cargo tauri build` bundles a signed installer for the current platform. This doc covers what you get, how to sign, and how to distribute.

## Output layout

```
src-tauri/target/release/bundle/
├── macos/
│   └── <productName>.app          # unsigned app bundle
├── dmg/
│   └── <productName>_<version>_<arch>.dmg
├── deb/
│   └── <productName>_<version>_<arch>.deb
├── appimage/
│   └── <productName>_<version>_<arch>.AppImage
├── rpm/
│   └── <productName>-<version>-1.<arch>.rpm
├── msi/
│   └── <productName>_<version>_<arch>_<lang>.msi
└── nsis/
    └── <productName>_<version>_<arch>-setup.exe
```

`cargo tauri build` produces only the formats supported by the current OS. Cross-compilation exists but has caveats — the [Tauri cross-platform docs](https://v2.tauri.app/distribute/) are authoritative.

## Configuration

Bundle metadata lives in `tauri.conf.json`:

```json
{
  "productName": "MyApp",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "externalBin": [],
    "copyright": "© 2026 Example Inc.",
    "category": "Productivity",
    "shortDescription": "Does a thing",
    "longDescription": "Does a thing very well"
  }
}
```

`targets` accepts `"all"`, `"none"`, or an array like `["dmg", "msi"]`.

## macOS signing and notarization

**Signing** proves the binary came from you. **Notarization** is Apple scanning it for malware. Users see a scary warning without both.

### Prerequisites

- Apple Developer Program membership ($99/year)
- A "Developer ID Application" certificate installed in your login keychain
- An app-specific password for `xcrun notarytool`

### Environment variables

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAMID"
```

Tauri's build step reads these and signs + notarizes automatically.

### Verify

```bash
codesign -dv --verbose=4 "target/release/bundle/macos/MyApp.app"
xcrun stapler validate "target/release/bundle/dmg/MyApp_1.0.0_aarch64.dmg"
```

## Windows signing

Options:

- **Certificate + `signtool.exe`** — traditional; requires an EV code-signing certificate (~$400/year)
- **Azure Trusted Signing** — newer, easier setup, still needs Microsoft account

Configure in `tauri.conf.json`:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "A1B2C3...",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

## Linux signing

`.deb` and `.rpm` packages can be signed with your GPG key. `.AppImage` supports embedded signatures.

There's no OS-level enforcement — Linux users routinely install unsigned binaries. Signing is optional but recommended if you distribute through a repository.

## Auto-update

Not covered by any demo in this repo (yet). The [Tauri updater plugin](https://v2.tauri.app/plugin/updater/) handles this:

- Bundle a public key in `tauri.conf.json`
- Sign releases with the matching private key
- Point the plugin at a JSON manifest listing release URLs and signatures
- On app start, the plugin checks the manifest and prompts the user to update

The signing keys are separate from OS code-signing certificates.

## Icons

Every bundle format needs different sizes. Generate them all from a single 1024×1024 source PNG:

```bash
cargo tauri icon path/to/app-icon.png
```

This writes `src-tauri/icons/` with:

- `32x32.png`, `128x128.png`, `128x128@2x.png` (Linux)
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- Various Android/iOS sizes (ignored for desktop builds)

## Reproducible builds

Cargo builds are not bit-for-bit reproducible by default (timestamps, path prefixes, etc.). If you need reproducibility, pin the toolchain (`rust-toolchain.toml`), use `--offline` after a warm cache, and follow the [Rust reproducible builds guide](https://github.com/rust-lang/rust/issues/34902).

## CI

GitHub Actions example: [`.github/workflows/build.yml`] (not included in this repo — see the [Tauri Action template](https://github.com/tauri-apps/tauri-action)).

Key points:

- Matrix build across `ubuntu-latest`, `macos-latest`, `windows-latest`
- Cache `~/.cargo` and `src-tauri/target`
- Set signing secrets as GitHub Actions secrets, expose as env vars in the build step
- Upload artifacts, then optionally publish a GitHub release

Tauri publishes an official action: `tauri-apps/tauri-action`. It handles the matrix, caching, signing, and release upload out of the box.
