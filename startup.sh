#!/bin/sh
set -e

PGDATA=/var/lib/postgresql/data
DB_NAME="${POSTGRES_DB:-sugarstack_db}"
DB_USER="${POSTGRES_USER:-sugarstack}"
DB_PASS="${POSTGRES_PASSWORD:-sugarstack_secret}"

# Railway injects PORT for external traffic -> that goes to Next.js
# API always runs on internal port 4001 to avoid conflict
WEB_PORT="${PORT:-3000}"
API_PORT_INTERNAL=4001

echo "==> PORT env: '${PORT}' | WEB_PORT: '$WEB_PORT' | API_PORT_INTERNAL: '$API_PORT_INTERNAL'"

# Initialize database on first run
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "==> Initializing PostgreSQL for the first time..."
  mkdir -p /run/postgresql && chown postgres:postgres /run/postgresql
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
mkdir -p /run/postgresql && chown postgres:postgres /run/postgresql
su-exec postgres pg_ctl -D "$PGDATA" -l /tmp/postgresql.log start || {
  echo "ERROR: PostgreSQL failed to start. Log:"
  cat /tmp/postgresql.log 2>/dev/null || cat /tmp/pg_init.log 2>/dev/null
  exit 1
}
sleep 3

export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

echo "==> Starting API on internal port $API_PORT_INTERNAL..."
PORT=$API_PORT_INTERNAL node /app/apps/api/dist/index.js &

sleep 3

echo "==> Starting web on port $WEB_PORT (API proxied from localhost:$API_PORT_INTERNAL)..."
cd /app/apps/web
export API_INTERNAL_URL="http://localhost:$API_PORT_INTERNAL"
exec /app/node_modules/.bin/next start -p "$WEB_PORT"
