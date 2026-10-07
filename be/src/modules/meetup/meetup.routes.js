const express = require('express');
const router = express.Router();
// 인증은 common/middleware/authorization.js로 처리 (중복이던 middlewares/auth.middleware.js 삭제)
const authorization = require('../../common/middleware/authorization');
const upload = require('../../common/middleware/uploadfile');
const meetupController = require('./meetup.controller');

// 인증을 먼저 수행함: 업로드가 Blob에 바로 저장되므로 비로그인 요청이 Blob에 파일을 남기지 못하게 함
router.post('/book-image', authorization, upload.single('image'), meetupController.uploadBookImage);
router.post('/', meetupController.createMeetup);
router.patch('/:meetup_id',  meetupController.updateMeetup);
router.get('/', meetupController.listMeetups);
router.get('/:meetup_id', meetupController.getMeetupDetail);
router.post('/:meetup_id/apply',  meetupController.applyMeetup);

module.exports = router;
