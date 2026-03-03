#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LT_DIR="$ROOT_DIR/localtickets"

if [[ ! -d "$LT_DIR/node_modules" ]]; then
  echo "Dependencies are missing. Run ./setup-localtickets.sh first."
  exit 1
fi

cd "$LT_DIR"

echo "Launching LocalTickets..."
echo "UI:  http://localhost:5173"
echo "API: http://localhost:3001"
npm run dev
