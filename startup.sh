#!/bin/sh
set -e

PGDATA=/var/lib/postgresql/data
DB_NAME="${POSTGRES_DB:-sugarstack_db}"
DB_USER="${POSTGRES_USER:-sugarstack}"
DB_PASS="${POSTGRES_PASSWORD:-sugarstack_secret}"

# Initialize database on first run
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "==> Initializing PostgreSQL for the first time..."
  su-exec postgres initdb -D "$PGDATA" --encoding=UTF8 --no-locale

  su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=''" -l /tmp/pg_init.log start
  sleep 2

  su-exec postgres psql postgres -c "CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASS';"
  su-exec postgres psql postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
  su-exec postgres psql "$DB_NAME" -f /app/schema.sql

  su-exec postgres pg_ctl -D "$PGDATA" -m fast stop
  sleep 1
  echo "==> Database initialized."
fi

echo "==> Starting PostgreSQL..."
su-exec postgres pg_ctl -D "$PGDATA" -l /tmp/postgresql.log start
sleep 3

export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Find the actual API entry point (handles both flat and nested tsup output)
if [ -f "/app/apps/api/dist/index.js" ]; then
  API_ENTRY="/app/apps/api/dist/index.js"
elif [ -f "/app/apps/api/dist/apps/api/src/index.js" ]; then
  API_ENTRY="/app/apps/api/dist/apps/api/src/index.js"
else
  echo "ERROR: Cannot find API entry point in /app/apps/api/dist/"
  find /app/apps/api/dist -name "*.js" | head -5
  exit 1
fi

echo "==> Starting API from $API_ENTRY..."
node "$API_ENTRY" &

echo "==> Starting web..."
cd /app/apps/web
exec /app/node_modules/.bin/next start -p 3000
