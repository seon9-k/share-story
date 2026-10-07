const { app } = require('@azure/functions');
const { callBackend } = require('../lib/callBackend');

app.timer('closeRecruitment', {
  // NCRONTAB 6자리: 초 분 시 일 월 요일
  // 10분마다 실행 → 마감 일시가 지난 모임은 최대 10분 안에 CLOSED (시간대 영향 없음)
  schedule: '0 */10 * * * *',
  runOnStartup: false,
  handler: async (myTimer, context) => {
    if (myTimer.isPastDue) context.warn('closeRecruitment timer is running late.');
    await callBackend('/batch/meetups/close-recruitment', context);
  },
});
