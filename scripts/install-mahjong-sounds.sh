#!/bin/bash
# Copy chi/peng/gang/hu MP3 files into public/assets/audio/
# Usage: ./scripts/install-mahjong-sounds.sh [/path/to/source]
set -euo pipefail

SRC="${1:-$HOME/Downloads}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/assets/audio"

mkdir -p "$DEST"

copy_one() {
  local src_name="$1"
  local dest_name="$2"
  if [[ ! -f "$SRC/$src_name" ]]; then
    echo "Missing: $SRC/$src_name" >&2
    exit 1
  fi
  cp "$SRC/$src_name" "$DEST/$dest_name"
  echo "OK $dest_name"
}

copy_one chi.mp3 chi.mp3
copy_one peng.mp3 peng.mp3
copy_one gang.mp3 gang.mp3
copy_one hu.mp3 hu.mp3

echo "Sounds installed to $DEST"
