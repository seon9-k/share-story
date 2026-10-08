#!/usr/bin/env bash
# 임시 DB가 준비되면 실제 BE를 띄움. 운영 자원에 접근하지 않도록 접속 정보를 모두 로컬 값으로 고정함
set -euo pipefail
cd "$(dirname "$0")/../../../be"
source ../fe/e2e/scripts/env.sh

for _ in $(seq 1 60); do
  pg_isready -q -U postgres -h 127.0.0.1 -p "$E2E_PG_PORT" && break
  sleep 0.5
done
pg_isready -U postgres -h 127.0.0.1 -p "$E2E_PG_PORT"
psql -q -h 127.0.0.1 -p "$E2E_PG_PORT" -U postgres -d postgres -c "CREATE DATABASE ${E2E_DB_NAME}"

# be/.env의 값은 이미 설정된 환경변수를 덮어쓰지 못하므로, 운영과 연결될 수 있는 키는 빈 값으로 막음
export PORT="$E2E_BE_PORT"
export JWT_SECRET=e2e-secret
export SALT_ROUNDS=4
export DIALECT=postgres
export DB_HOST=127.0.0.1 DB_PORT="$E2E_PG_PORT" DB_NAME="$E2E_DB_NAME" DB_USER=postgres DB_PASSWORD= DB_SSL=false
export CORS_ORIGIN="$E2E_FE_URL"
export BATCH_API_KEY=e2e-batch-key
export AZURE_STORAGE_CONNECTION_STRING= AZURE_STORAGE_CONTAINER_NAME=
export SMTP_HOST= SMTP_USER= SMTP_PASS= MAIL_FROM=
exec node src/server.js
