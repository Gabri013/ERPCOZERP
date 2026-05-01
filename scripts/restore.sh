#!/usr/bin/env bash
set -euo pipefail

# Restaura um backup SQL gerado por scripts/backup.sh.
# Uso: ./scripts/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 caminho/arquivo.sql" >&2
  exit 1
fi

SQL_FILE="$(realpath "$1")"
if [[ ! -f "$SQL_FILE" ]]; then
  echo "Arquivo não encontrado: $SQL_FILE" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-erpcoz}"
POSTGRES_DB="${POSTGRES_DB:-erpcoz}"

read -r -p "Isto vai SOBRESCREVER objetos existentes na base ${POSTGRES_DB}. Continuar? [s/N] " reply
[[ "${reply:-}" =~ ^[sSyY]$ ]] || { echo "Cancelado."; exit 2; }

cat "$SQL_FILE" | docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "[restore] Concluído a partir de $SQL_FILE"
