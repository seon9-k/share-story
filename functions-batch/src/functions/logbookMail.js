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
  schedule: '0 0 9 * * *',
  runOnStartup: false,
  handler: logbookMail,
});
