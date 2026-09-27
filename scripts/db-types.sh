#!/usr/bin/env bash
# Regenerates src/lib/database.types.ts from a Postgres database that has the
# migrations applied. Prefers the supabase CLI (needs Docker); falls back to
# running @supabase/postgres-meta directly, which needs no Docker.
#
#   DB_URL=postgresql://postgres:postgres@127.0.0.1:5432/thirtyml_test scripts/db-types.sh
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:5432/thirtyml_test}"
OUT="src/lib/database.types.ts"

if npx -y supabase@latest gen types typescript --db-url "$DB_URL" --schema public > "$OUT" 2>/dev/null; then
  echo "generated $OUT via supabase CLI"
  exit 0
fi

echo "supabase CLI unavailable (no Docker?); using postgres-meta directly"
WORK=$(mktemp -d)
trap 'kill $PGMETA_PID 2>/dev/null || true; rm -rf "$WORK"' EXIT
(cd "$WORK" && npm init -y >/dev/null 2>&1 && npm i @supabase/postgres-meta >/dev/null 2>&1)
PG_META_DB_URL="$DB_URL" PG_META_PORT=9801 \
  node "$WORK/node_modules/@supabase/postgres-meta/dist/server/server.js" >/dev/null 2>&1 &
PGMETA_PID=$!
sleep 4
curl -sf "http://127.0.0.1:9801/generators/typescript?included_schemas=public&detect_one_to_one_relationships=true" -o "$OUT"
echo "generated $OUT via postgres-meta"
