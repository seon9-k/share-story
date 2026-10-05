const express = require('express');
const router = express.Router();
// 인증은 member/meetup.routes.js에서 common/middleware/authorization.js로 처리
// (중복이던 middlewares/auth.middleware.js 삭제)
const meetupController = require('./meetup.controller');

router.post('/', meetupController.createMeetup);
router.patch('/:meetup_id',  meetupController.updateMeetup);
router.get('/', meetupController.listMeetups);
router.get('/:meetup_id', meetupController.getMeetupDetail);
router.post('/:meetup_id/apply',  meetupController.applyMeetup);

module.exports = router;
