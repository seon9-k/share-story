const router = require('express').Router();
const batchAuth = require('../../common/middleware/batchAuth');
const batch = require('./batch.controller');

// 사용자 JWT가 아닌 x-batch-key로만 호출 가능
router.use(batchAuth);
router.post('/meetups/close-recruitment', batch.closeRecruitment);
router.post('/meetups/start', batch.startMeetups);
router.post('/meetups/complete', batch.completeMeetups);

module.exports = router;
