const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const controller = require('./review.controller');

router.use(authorization);
router.post('/meetups/:meetup_id', controller.create);
router.get('/meetups/:meetup_id', controller.list);
// 본인 리뷰 수정·삭제 (모임당 1개라 /me로 지정)
router.patch('/meetups/:meetup_id/me', controller.update);
router.delete('/meetups/:meetup_id/me', controller.remove);

module.exports = router;
