#!/usr/bin/env bash
set -euo pipefail

# Seed sample rows into Postgres via SSH -> Docker -> psql.
# Usage:
#   bash dummy-pending.sh
#   KEY=~/.ssh/id_rsa_gcp HOST=brianhenning@34.132.189.202 bash dummy-pending.sh

# Config (override via env if needed)
KEY="${KEY:-$HOME/.ssh/id_rsa_gcp}"
HOST="${HOST:-brianhenning@34.132.189.202}"
CONTAINER="${CONTAINER:-postgresql-server}"
DB="${DB:-finance_db}"
# Avoid clobbering shell's $USER; use DB_USER for psql auth
DB_USER="${DB_USER:-postgres}"

echo "Seeding sample rows into ${DB}.t_pending_transaction on ${HOST}..."

# Optional: Inspect table schema to confirm columns
# ssh -i "$KEY" "$HOST" "docker exec $CONTAINER psql -U $DB_USER -d $DB -c '\\d+ t_pending_transaction'"

# Insert sample pending transactions using only the specified columns
ssh -i "$KEY" "$HOST" "docker exec -i $CONTAINER psql -U $DB_USER -d $DB" <<'SQL'
INSERT INTO t_pending_transaction (
  account_name_owner,
  amount,
  description,
  transaction_date
) VALUES
  ('xyz_brian',  -42.35, 'Coffee shop',  '2025-08-14'),
  ('xyz_brian', -128.99, 'Groceries',    '2025-08-13'),
  ('xyz_brian',  -13.49, 'Ride share',   '2025-08-15'),
  ('xyz_brian',  -59.00, 'Utilities',    '2025-08-11'),
  ('xyz_brian',   -7.99, 'Streaming',    '2025-08-15'),
  ('xyz_brian', -215.75, 'Airline fare', '2025-08-12'),
  ('xyz_brian',  -24.18, 'Lunch',        '2025-08-14'),
  ('xyz_brian',  -89.00, 'Shoes',        '2025-08-15')
ON CONFLICT DO NOTHING;
SQL

echo "Done. Preview the rows with:"
echo "  ssh -i '$KEY' '$HOST' 'docker exec $CONTAINER psql -U $DB_USER -d $DB -c '\''SELECT account_name_owner, amount, description, transaction_date FROM t_pending_transaction ORDER BY transaction_date DESC NULLS LAST LIMIT 10;'\'''"
