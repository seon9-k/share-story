const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const controller = require('./logbook.controller');

router.use(authorization);
router.get('/meetups/:meetup_id/sessions/:session_id/me', controller.mine);
router.put('/meetups/:meetup_id/sessions/:session_id/me', controller.save);
router.get('/meetups/:meetup_id/sessions/:session_id', controller.list);

module.exports = router;
