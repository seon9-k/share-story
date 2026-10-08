#!/usr/bin/env bash
# 일회용 PostgreSQL을 띄움. 실행할 때마다 데이터 디렉터리를 새로 만들어 이전 데이터가 남지 않음
# Playwright가 종료하면 SIGTERM으로 함께 종료됨 (exec로 postgres가 직접 신호를 받음)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

DATA_DIR="$(pwd)/.pgdata"
rm -rf "$DATA_DIR" "$E2E_PG_SOCKET_DIR"
mkdir -p "$E2E_PG_SOCKET_DIR"
initdb -D "$DATA_DIR" -A trust -U postgres --no-locale -E UTF8 >/dev/null
# 운영 DB(UTC)와 같은 시간대로 동작시켜 시간대 의존 문제를 드러냄
exec postgres -D "$DATA_DIR" -p "$E2E_PG_PORT" -k "$E2E_PG_SOCKET_DIR" \
  -c listen_addresses=127.0.0.1 -c timezone=UTC -c fsync=off
