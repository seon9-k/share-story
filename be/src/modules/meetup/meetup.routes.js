const express = require('express');
const meetupController = require('./meetup.controller');
const { validateMeetupId } = require('./meetup.validation');

const router = express.Router();

/**
 * [Route]
 * - API의 URL과 HTTP Method를 정의합니다.
 * - 필요한 validation / 인증 middleware를 연결합니다.
 * - 실제 요청 처리는 Controller에 위임합니다.
 *
 * GET /meetup/:meetupId
 * 미트업 단건 조회
 */
// router.get('/:meetupId', validateMeetupId, meetupController.getMeetup); // validation 사용 시
router.get('/:meetupId', meetupController.getMeetup);

module.exports = router;
