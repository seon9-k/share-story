const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const controller = require('./logbook.controller');

router.use(authorization);
// 내가 제출한 로그북을 모임별로 모아보기 (여러 모임 포함)
router.get('/mine', controller.listMine);
router.get('/meetups/:meetup_id/sessions/:session_id/me', controller.mine);
router.put('/meetups/:meetup_id/sessions/:session_id/me', controller.save);
// 본인 로그북 삭제
router.delete('/meetups/:meetup_id/sessions/:session_id/me', controller.remove);
// 모임장의 숙제 확인 완료 승인·취소 (REQ-SES-003)
router.patch('/meetups/:meetup_id/sessions/:session_id/logbooks/:logbook_id/approval', controller.approve);
router.get('/meetups/:meetup_id/sessions/:session_id', controller.list);

module.exports = router;
