#!/usr/bin/env bash
# generate-icons.sh — populate every demo's src-tauri/icons/ from a shared source PNG.
#
# Usage:
#   ./scripts/generate-icons.sh                       # uses shared/icons/source.png
#   ./scripts/generate-icons.sh path/to/my-icon.png   # uses your image (>= 1024x1024)
#
# Requires: cargo tauri CLI (`cargo install tauri-cli --version "^2.0.0" --locked`)
# Optional: ImageMagick (`magick` or `convert`) — generates a placeholder source if none exists

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SOURCE="${1:-shared/icons/source.png}"

# Ensure cargo tauri is installed
if ! cargo tauri --version >/dev/null 2>&1; then
    echo "error: 'cargo tauri' is not installed."
    echo "install with: cargo install tauri-cli --version \"^2.0.0\" --locked"
    exit 1
fi

# If no source image, try to synthesize one with ImageMagick
if [[ ! -f "$SOURCE" ]]; then
    mkdir -p "$(dirname "$SOURCE")"
    if command -v magick >/dev/null 2>&1; then
        echo "generating placeholder source icon at $SOURCE (ImageMagick 7)"
        magick -size 1024x1024 gradient:'#4a90e2-#7c3aed' \
               -gravity center -pointsize 400 -fill white -font Helvetica \
               -annotate +0+0 'T' "$SOURCE"
    elif command -v convert >/dev/null 2>&1; then
        echo "generating placeholder source icon at $SOURCE (ImageMagick 6)"
        convert -size 1024x1024 gradient:'#4a90e2-#7c3aed' \
                -gravity center -pointsize 400 -fill white -font Helvetica \
                -annotate +0+0 'T' "$SOURCE"
    else
        cat >&2 <<EOF
error: no source icon found at $SOURCE and ImageMagick is not installed.

Options:
  1. Install ImageMagick and re-run this script:
       macOS:  brew install imagemagick
       Debian: sudo apt install imagemagick
  2. Provide your own 1024x1024 PNG:
       cp /path/to/your-icon.png $SOURCE
       ./scripts/generate-icons.sh
  3. Pass the path directly:
       ./scripts/generate-icons.sh /path/to/your-icon.png
EOF
        exit 1
    fi
fi

# Generate per-demo icon sets
ABS_SOURCE="$(cd "$(dirname "$SOURCE")" && pwd)/$(basename "$SOURCE")"

for conf in apps/*/src-tauri/tauri.conf.json; do
    demo_dir="$(dirname "$(dirname "$conf")")"
    echo "→ $demo_dir"
    ( cd "$demo_dir" && cargo tauri icon "$ABS_SOURCE" >/dev/null )
done

echo
echo "done. Every apps/*/src-tauri/icons/ is populated."
