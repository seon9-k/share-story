const router = require('express').Router();
const service = require('./review.public.service');

// 로그인 없이 조회 가능한 공개 API (홈 화면 항해일지용). 이름은 서비스에서 가려서 반환함
router.get('/', async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, document: await service.listHighlights() });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
