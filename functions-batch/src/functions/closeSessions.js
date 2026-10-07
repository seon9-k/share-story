const { app } = require('@azure/functions');
const { callBackend } = require('../lib/callBackend');

app.timer('closeSessions', {
  // 매일 07:00 KST = 전날 22:00 UTC
  // Flex Consumption은 WEBSITE_TIME_ZONE 미지원이라 UTC 기준으로 작성함 (completeMeetups와 동일)
  schedule: '0 0 22 * * *',
  runOnStartup: false,
  handler: async (myTimer, context) => {
    if (myTimer.isPastDue) context.warn('closeSessions timer is running late.');
    // x-batch-key 인증 포함. BE가 메일 발송 실패를 500으로 돌려주면 이 함수도 실패로 기록됨
    await callBackend('/session/close', context);
  },
});
