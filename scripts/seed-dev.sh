#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/apps/backend"
echo "[seed-dev] Prisma seed (env SEED_ENABLED=true)..."
SEED_ENABLED=true npx tsx prisma/seed.ts
echo "[seed-dev] Concluído."
