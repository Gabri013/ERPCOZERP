#!/usr/bin/env bash
set -euo pipefail

# Gera backup SQL plain-text do Postgres do stack ERP (compose erpcoz / db erpcoz).
# Cron (Linux): 0 2 * * * cd /path/ERPCOZERP && POSTGRES_SERVICE=postgres ./scripts/backup.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-erpcoz}"
POSTGRES_DB="${POSTGRES_DB:-erpcoz}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/backup_${STAMP}.sql"

docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$OUT"

echo "[backup] Salvo em $OUT"
