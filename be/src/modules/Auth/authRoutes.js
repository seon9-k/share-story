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
    const { phone, name, password, lvl } = req.body;
    // 휴대폰 번호 "-" 제거
    const phoneUnderscodeRemove = phone.replaceAll("-", "");

    const member = await Member.findOne({ where : { phone : phoneUnderscodeRemove } });
    //중복체크
    if(member){
      return res.status(409).json({ success: false, message : `이미 가입이 되어있습니다. ${ phone }` });
    }

    const newPassword = await createHash(password);
    const result = await Member.create({ phone : phoneUnderscodeRemove, name : name, password : newPassword,  lvl : lvl });

    res.status(201).json({ success: true, document : { id : result.id, name : result.name, phone : result.phone, lvl:result.lvl }, message : '회원가입에 완료되었습니다.' })

  } catch (error) {
    next(error, req, res);
  }
});

/* POST /auth/sign-in */
router.post('/sign-in', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const phoneUnderscodeRemove = phone.replaceAll("-", "");
    const member = await Member.findOne({ where : { phone : phoneUnderscodeRemove } });

    //이메일체크, 비밀번호 확인
    if(!member || !(await bcrypt.compare(password, member.password))){
      return res.status(400).json({ success: false, message : `회원정보가 잘못되었습니다.` })
    }

    const id = member.id;
    const lvl = member.lvl;
    const option = { expiresIn : '1d' };
    //토큰생성, payload는 { id, lvl }
    const token = jwt.sign({ id, lvl }, secret);
    //console.log(`token ===> ${token}`);

    res.status(200).json({ success: true, token : token, message : '로그인에 완료되었습니다.' })

  } catch (error) {
    //console.log(`error ===> ${error}`);
    next(error, req, res);
  }
});


module.exports = router;
