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
  schedule: '0 0 7 * * *',
  runOnStartup: false,
  handler: closeSessions,
});
