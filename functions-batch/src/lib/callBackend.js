// BE 배치 엔드포인트 호출 공통 함수
async function callBackend(path, context) {
  const baseUrl = process.env.BACKEND_BASE_URL;
  const batchKey = process.env.BATCH_API_KEY; // BE batchAuth와 같은 값
  if (!baseUrl || !batchKey) throw new Error('BACKEND_BASE_URL 또는 BATCH_API_KEY 앱 설정 누락');

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'x-batch-key': batchKey },
    signal: AbortSignal.timeout(60_000), // BE 응답 없으면 60초 후 실패 처리
  });
  const body = await response.text();

  if (!response.ok) {
    context.error(`POST ${path} failed: ${response.status} ${body}`);
    throw new Error(`POST ${path} failed with ${response.status}`); // 실패로 기록되어 App Insights에서 확인 가능
  }
  context.log(`POST ${path} succeeded: ${body}`);
}

module.exports = { callBackend };
