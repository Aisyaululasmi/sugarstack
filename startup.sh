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

  # Start temporarily (local socket only) to set up users and schema
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

echo "==> Starting API and web..."
exec pm2-runtime start /app/ecosystem.config.js
