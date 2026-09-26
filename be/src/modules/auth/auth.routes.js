const router = require('express').Router();
const { signUp, signIn, getMyInfo, updateMyInfo } = require('./auth.controller');

router.post('/signup', signUp);
router.post('/login', signIn);
router.get('/user/myInfo', getMyInfo);
router.patch('/user/myInfo', updateMyInfo);

module.exports = router;
