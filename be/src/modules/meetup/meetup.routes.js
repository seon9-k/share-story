const express = require('express');
const router = express.Router();
//const { verifyToken } = require('../../middlewares/auth.middleware');
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
