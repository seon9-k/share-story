const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const controller = require('./review.controller');

router.use(authorization);
router.post('/meetups/:meetup_id', controller.create);
router.get('/meetups/:meetup_id', controller.list);

module.exports = router;
