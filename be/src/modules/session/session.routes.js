const express = require('express');
const router = express.Router();
const batchAuth = require('../../common/middleware/batchAuth');
const sessionController = require('./session.controller');

// 메일 발송·회차 완료 처리는 스케줄러 전용이므로 /batch와 같은 x-batch-key로만 호출 가능함
// 인증이 없던 때는 누구나 호출해 메일 발송을 일으킬 수 있었음
router.use(batchAuth);
router.post('/zoom-mail', sessionController.sendZoomMail);
router.post('/close', sessionController.closeSessions);
router.post('/logbook-mail', sessionController.sendLogbookMail);

module.exports = router;
