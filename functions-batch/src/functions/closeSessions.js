const { app } = require('@azure/functions');

async function closeSessions(myTimer, context) {
  if (myTimer.isPastDue) context.warn('closeSessions timer is running late.');

  const baseUrl = process.env.BACKEND_BASE_URL;
  const response = await fetch(`${baseUrl}/session/close`, { method: 'POST' });
  const body = await response.text();

  if (!response.ok) {
    context.error(`closeSessions failed: ${response.status} ${body}`);
    throw new Error(`POST /session/close failed with ${response.status}`);
  }

  context.log(`closeSessions succeeded: ${body}`);
}

app.timer('closeSessions', {
  // 매일 07:00 KST (WEBSITE_TIME_ZONE 앱 설정 적용)
  // TODO: Flex Consumption은 WEBSITE_TIME_ZONE 미지원이라 이 값이 UTC로 해석됨
  //       → KST 07:00에 돌리려면 전날 22:00 UTC 기준인 '0 0 22 * * *'로 변경 필요
  //       (배포 후 App Insights에서 첫 실행 시각 확인 필요, 확인 전까지는 값 유지)
  schedule: '0 0 7 * * *',
  runOnStartup: false,
  handler: closeSessions,
});
