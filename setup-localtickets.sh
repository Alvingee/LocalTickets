#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LT_DIR="$ROOT_DIR/localtickets"
DATA_DIR="$LT_DIR/data"

install_nodejs() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "Node.js/npm not found. Attempting install via apt-get..."
    sudo apt-get update
    sudo apt-get install -y nodejs npm
  elif command -v dnf >/dev/null 2>&1; then
    echo "Node.js/npm not found. Attempting install via dnf..."
    sudo dnf install -y nodejs npm
  elif command -v yum >/dev/null 2>&1; then
    echo "Node.js/npm not found. Attempting install via yum..."
    sudo yum install -y nodejs npm
  elif command -v pacman >/dev/null 2>&1; then
    echo "Node.js/npm not found. Attempting install via pacman..."
    sudo pacman -Sy --noconfirm nodejs npm
  elif command -v brew >/dev/null 2>&1; then
    echo "Node.js/npm not found. Attempting install via Homebrew..."
    brew install node
  else
    echo "Error: Node.js and npm are required but no supported package manager was found."
    exit 1
  fi
}

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  install_nodejs
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Error: failed to install Node.js/npm automatically."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
NPM_MAJOR="$(npm -v | cut -d. -f1)"

if (( NODE_MAJOR < 20 )); then
  echo "Error: Node.js 20+ required (found $(node -v))."
  echo "Please upgrade Node.js and re-run setup-localtickets.sh."
  exit 1
fi

if (( NPM_MAJOR < 10 )); then
  echo "Error: npm 10+ required (found $(npm -v))."
  echo "Please upgrade npm and re-run setup-localtickets.sh."
  exit 1
fi

mkdir -p "$DATA_DIR"
[[ -f "$DATA_DIR/epics.json" ]] || echo "[]" > "$DATA_DIR/epics.json"
[[ -f "$DATA_DIR/stories.json" ]] || echo "[]" > "$DATA_DIR/stories.json"

cd "$LT_DIR"

echo "Installing/updating project dependencies..."
npm install

echo

echo "Setup complete."
echo "Run ./run-localtickets.sh to launch LocalTickets."
