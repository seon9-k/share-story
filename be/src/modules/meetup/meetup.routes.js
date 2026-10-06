const express = require('express');
const router = express.Router();
// 인증은 common/middleware/authorization.js로 처리 (중복이던 middlewares/auth.middleware.js 삭제)
const authorization = require('../../common/middleware/authorization');
const upload = require('../../common/middleware/uploadfile');
const meetupController = require('./meetup.controller');

router.post('/book-image', upload.single('image'), authorization, meetupController.uploadBookImage);
router.post('/', meetupController.createMeetup);
router.patch('/:meetup_id',  meetupController.updateMeetup);
router.get('/', meetupController.listMeetups);
router.get('/:meetup_id', meetupController.getMeetupDetail);
router.post('/:meetup_id/apply',  meetupController.applyMeetup);

module.exports = router;
