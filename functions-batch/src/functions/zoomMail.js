const { app } = require('@azure/functions');

async function zoomMail(myTimer, context) {
  if (myTimer.isPastDue) context.warn('zoomMail timer is running late.');

  const baseUrl = process.env.BACKEND_BASE_URL;
  const response = await fetch(`${baseUrl}/session/zoom-mail`, { method: 'POST' });
  const body = await response.text();

  if (!response.ok) {
    context.error(`zoomMail failed: ${response.status} ${body}`);
    throw new Error(`POST /session/zoom-mail failed with ${response.status}`);
  }

  context.log(`zoomMail succeeded: ${body}`);
}

app.timer('zoomMail', {
  // 매일 08:00 KST (WEBSITE_TIME_ZONE 앱 설정 적용)
  schedule: '0 0 8 * * *',
  runOnStartup: false,
  handler: zoomMail,
});
