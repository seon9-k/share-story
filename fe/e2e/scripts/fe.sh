#!/usr/bin/env bash
# 배포와 같은 프로덕션 빌드를 만들어 preview로 서빙함 (개발 서버가 아닌 실제 번들을 검증)
set -euo pipefail
cd "$(dirname "$0")/../.."
source e2e/scripts/env.sh

# fe/dist는 건드리지 않도록 별도 폴더에 빌드함
VITE_API_BASE_URL="$E2E_BE_URL" npx vite build --outDir .e2e-dist --emptyOutDir >/dev/null
exec npx vite preview --outDir .e2e-dist --host 127.0.0.1 --port "$E2E_FE_PORT" --strictPort
