const router = require('express').Router();
const authorization = require('../../common/middleware/authorization');
const { signUp, login, checkUserId, updateMyInfo } = require('./auth.controller');

router.post('/signup', signUp);
router.post('/login', login);
// 아이디 중복확인. 기존 경로 /getMyInfo → 기능에 맞게 /check-id로 변경 (FE 함께 수정)
router.post('/check-id', checkUserId);
// 본인만 수정 가능하도록 토큰 검증 추가 (기존엔 인증 없이 body.user_id로 누구나 수정 가능했음)
router.patch('/updateMyInfo', authorization, updateMyInfo);

module.exports = router;
