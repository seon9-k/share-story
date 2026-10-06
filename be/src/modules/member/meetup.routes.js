const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const controller = require('./meetup.controller');

// 기존 meetup 모듈을 수정하지 않고 인증과 신청 처리를 보완.
router.post('/', authorization, (req, res, next) => next());
router.patch('/:meetup_id', authorization, (req, res, next) => next());
router.post('/:meetup_id/apply', authorization, controller.applyMeetup);

module.exports = router;
