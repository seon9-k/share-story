const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const meetup = require('./meetup.controller');
const session = require('./session.controller');
const crew = require('./crew.controller');
const profile = require('./profile.controller');

router.use(authorization);
router.get('/me', profile.me);
router.get('/meetups', meetup.listMeetups);
router.get('/meetups/captain', meetup.listCaptainMeetups);
router.get('/meetups/crew', meetup.listCrewMeetups);
router.post('/meetups/:meetup_id/apply', meetup.applyMeetup);
router.get('/meetups/:meetup_id/sessions', session.listSessions);
router.get('/meetups/:meetup_id/crews', crew.list);

module.exports = router;
