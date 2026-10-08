#!/usr/bin/env bash
# 테스트 문서 재생성: 일회용 PostgreSQL을 띄워 세 도구를 실행하고 결과를 docs/테스트/ 문서로 만듦
# 필요: Node.js 24, PostgreSQL 명령(initdb·pg_ctl·psql), be·fe의 npm install, Chromium(npx playwright install chromium)
# 일부 테스트가 실패해도 문서는 실패 내용을 담아 생성하고, 마지막에 실패가 있으면 종료 코드 1로 끝남
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
PG_PORT=54329
PG_SOCK=/tmp/sharestory-testdocs-pg
FAILED=0

cleanup() {
  pg_ctl -D "$TMP/pgdata" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$TMP" "$PG_SOCK"
}
trap cleanup EXIT

echo "[1/5] 일회용 PostgreSQL 시작"
rm -rf "$PG_SOCK" && mkdir -p "$PG_SOCK"
initdb -D "$TMP/pgdata" -A trust -U postgres --no-locale -E UTF8 >/dev/null
pg_ctl -D "$TMP/pgdata" -o "-p $PG_PORT -k $PG_SOCK -c listen_addresses=127.0.0.1 -c timezone=UTC" -l "$TMP/pg.log" -w start >/dev/null

echo "[2/5] BE 테스트 (Jest, 실제 DB 포함)"
( cd "$ROOT/be" && TEST_DATABASE_URL="postgres://postgres@127.0.0.1:$PG_PORT/postgres" \
  npx jest --silent --json --outputFile="$TMP/be.json" >/dev/null 2>&1 ) || { echo "  → BE 실패 있음"; FAILED=1; }

echo "[3/5] FE 테스트 (Vitest)"
( cd "$ROOT/fe" && npx vitest run --reporter=json --outputFile="$TMP/fe.json" >/dev/null 2>&1 ) || { echo "  → FE 실패 있음"; FAILED=1; }

echo "[4/5] E2E 테스트 (Playwright)"
( cd "$ROOT/fe" && PLAYWRIGHT_JSON_OUTPUT_NAME="$TMP/e2e.json" npx playwright test --reporter=json >/dev/null 2>&1 ) || { echo "  → E2E 실패 있음"; FAILED=1; }

echo "[5/5] 문서 생성"
node "$ROOT/docs/tools/generate-test-docs.js" --be "$TMP/be.json" --fe "$TMP/fe.json" --e2e "$TMP/e2e.json" || exit 2

exit $FAILED
