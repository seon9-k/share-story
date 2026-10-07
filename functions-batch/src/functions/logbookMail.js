const { app } = require('@azure/functions');

async function logbookMail(myTimer, context) {
  if (myTimer.isPastDue) context.warn('logbookMail timer is running late.');

  const baseUrl = process.env.BACKEND_BASE_URL;
  const response = await fetch(`${baseUrl}/session/logbook-mail`, { method: 'POST' });
  const body = await response.text();

  if (!response.ok) {
    context.error(`logbookMail failed: ${response.status} ${body}`);
    throw new Error(`POST /session/logbook-mail failed with ${response.status}`);
  }

  context.log(`logbookMail succeeded: ${body}`);
}

app.timer('logbookMail', {
  // 매일 09:00 KST (WEBSITE_TIME_ZONE 앱 설정 적용)
  // TODO: Flex Consumption은 WEBSITE_TIME_ZONE 미지원이라 이 값이 UTC로 해석됨
  //       → KST 09:00에 돌리려면 당일 00:00 UTC 기준인 '0 0 0 * * *'로 변경 필요
  //       (배포 후 App Insights에서 첫 실행 시각 확인 필요, 확인 전까지는 값 유지)
  schedule: '0 0 9 * * *',
  runOnStartup: false,
  handler: logbookMail,
});
