#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LT_DIR="$ROOT_DIR/localtickets"
DATA_DIR="$LT_DIR/data"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 20+ is required but not installed."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm 10+ is required but not installed."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
NPM_MAJOR="$(npm -v | cut -d. -f1)"

if (( NODE_MAJOR < 20 )); then
  echo "Error: Node.js 20+ required (found $(node -v))."
  exit 1
fi

if (( NPM_MAJOR < 10 )); then
  echo "Error: npm 10+ required (found $(npm -v))."
  exit 1
fi

mkdir -p "$DATA_DIR"
[[ -f "$DATA_DIR/epics.json" ]] || echo "[]" > "$DATA_DIR/epics.json"
[[ -f "$DATA_DIR/stories.json" ]] || echo "[]" > "$DATA_DIR/stories.json"

cd "$LT_DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed."
fi

echo "Launching LocalTickets..."
echo "UI:  http://localhost:5173"
echo "API: http://localhost:3001"
npm run dev
