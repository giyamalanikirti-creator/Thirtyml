#!/usr/bin/env bash
# Applies the auth shim, all migrations, seed data, and the SQL test suite to
# a throwaway Postgres database.
#
# Local (Ubuntu socket as the postgres superuser):  scripts/db-test.sh
# CI / custom server: ADMIN_URL=postgresql://postgres:postgres@localhost:5432 scripts/db-test.sh
set -euo pipefail

DB=thirtyml_test

if [ -n "${ADMIN_URL:-}" ]; then
  RUN() { psql "$ADMIN_URL/$1" -v ON_ERROR_STOP=1 -q "${@:2}"; }
  psql "$ADMIN_URL/postgres" -v ON_ERROR_STOP=1 -q \
    -c "drop database if exists $DB" -c "create database $DB"
else
  RUN() { sudo -u postgres psql -d "$1" -v ON_ERROR_STOP=1 -q "${@:2}"; }
  sudo -u postgres dropdb --if-exists "$DB"
  sudo -u postgres createdb "$DB"
fi

echo "· auth shim"
RUN "$DB" -f supabase/tests/auth_shim.sql

for f in supabase/migrations/*.sql; do
  echo "· $f"
  RUN "$DB" -f "$f"
done

echo "· seed"
RUN "$DB" -f supabase/seed.sql

echo "· tests"
RUN "$DB" -f supabase/tests/rls.test.sql

echo "OK: migrations, seed and RLS tests all passed"
