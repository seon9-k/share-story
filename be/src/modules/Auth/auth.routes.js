const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const { User } = require('../models/index');

//password hash
const createHash = (password) => {
  let hashed = bcrypt.hash(password, Number(process.env.SALT_ROUND));
  return hashed;
}

/* POST /auth/sign-up */
router.post('/sign-up', async (req, res, next) => {
  try {
    const { name, password, user_id } = req.body;
    const user = await User.findOne({ where : { user_id : user_id } });
    //중복체크
    if(user){
      return res.status(409).json({ success: false, message : `이미 가입이 되어있습니다. ${ user_id }` });
    }
    // 비밀번호 해시화
    const newPassword = await createHash(password);
    const result = await User.create({ name : name, password : newPassword,  user_id : user_id });

  res.status(201).json({ success: true, document : { name : result.name, user_id: result.user_id }, message : '회원가입에 완료되었습니다.' })

  } catch (error) {
    next(error, req, res);
  }
});

/* POST /auth/sign-in */
router.post('/sign-in', async (req, res, next) => {
  try {
    const { password, user_id, email } = req.body;

    const user = await User.findOne({ where : { user_id : user_id } });

    //이메일체크, 비밀번호 확인
    if(!user || !(await bcrypt.compare(password, user.password))){
      return res.status(400).json({ success: false, message : `회원정보가 잘못되었습니다.` })
    }

    const option = { expiresIn : 'user_id' };
    //토큰생성, payload는 {user_id }
    const token = jwt.sign({ user_id }, secret);
    //console.log(`token ===> ${token}`);

    res.status(200).json({ success: true, token : token, message : '로그인에 완료되었습니다.' })

  } catch (error) {
    //console.log(`error ===> ${error}`);
    next(error, req, res);
  }
});

module.exports = router;
