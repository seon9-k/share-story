const { app } = require('@azure/functions');
const { callBackend } = require('../lib/callBackend');

app.timer('startMeetups', {
  // 매일 00:10 KST = 전날 15:10 UTC
  // Flex Consumption은 WEBSITE_TIME_ZONE 미지원이라 UTC 기준으로 작성함
  schedule: '0 10 15 * * *',
  runOnStartup: false,
  handler: async (myTimer, context) => {
    if (myTimer.isPastDue) context.warn('startMeetups timer is running late.');
    await callBackend('/batch/meetups/start', context);
  },
});
