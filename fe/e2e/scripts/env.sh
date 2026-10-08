# E2E 공통 설정. 임시 DB·BE·FE 포트와 접속 정보를 한 곳에서 관리함
export E2E_PG_PORT=54330
export E2E_PG_SOCKET_DIR=/tmp/sharestory-e2e-pg
export E2E_DB_NAME=sharestory_e2e
export E2E_BE_PORT=3100
export E2E_FE_PORT=4173
export E2E_BE_URL="http://127.0.0.1:${E2E_BE_PORT}"
export E2E_FE_URL="http://127.0.0.1:${E2E_FE_PORT}"
