const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const { User } = require('../../models/index');

//password hash
const createHash = async (password) => {
  const saltRounds = parseInt(process.env.SALT_ROUND, 10) || 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
};

/* POST /auth/signup */
router.post('/signup', async (req, res, next) => {
  try {
    console.log("▶ [Postman 요청 수신] Body:", req.body);
    const { name, password, user_id } = req.body;

    // 유효성 검사
    if (!user_id || !password || !name) {
      return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });
    }

    //중복체크
    const user = await User.findOne({ where : { user_id : user_id } });
    console.log('POST /auth/signup ', user);
    if(user){
      return res.status(409).json({ success: false, message : `이미 가입이 되어있습니다. ${ user_id }` });
    }
    // 비밀번호 해시화
    const newPassword = await createHash(password);

    // DB 생성
    const result = await User.create({ name : name, password : newPassword,  user_id : user_id });

    // 응답 전달
    res.status(201).json({ success: true, document : { name : result.name, user_id: result.user_id }, message : '회원가입에 완료되었습니다.' })

  } catch (error) {
    console.error("회원가입 처리 중 에러 발생:", error);
    next(error);
  }
});

/* POST /auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { password, user_id } = req.body;

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

/* GET /user/myInfo */
router.get('/user/myInfo', async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const user = await User.findOne({ where : { user_id : user_id } });

    res.status(200).json({ success: true, message : '조회 되었습니다.', user });

  } catch (error) {
    //console.log(`error ===> ${error}`);
    next(error, req, res);
  }
});

/* PATCH /user/myInfo */
router.patch('/user/myInfo', async (req, res, next) => {
  try {
    const { password, user_id, email, name, gender, age_group, monthly_reading_volume, genre_1, genre_2 } = req.body;
    const user = await User.update( 
          { 
              email: email
            , name: name
            , gender: gender
            , age_group: age_group
            , monthly_reading_volume: monthly_reading_volume
            , genre_1: genre_1
            , genre_2: genre_2 
          }
          , { where : { user_id : user_id } });

    //이메일체크, 비밀번호 확인
    if(!user || !(await bcrypt.compare(password, user.password))){
      return res.status(400).json({ success: false, message : `회원정보가 잘못되었습니다.` })
    }

    res.status(200).json({ success: true, token : token, message : '로그인에 완료되었습니다.' })

  } catch (error) {
    //console.log(`error ===> ${error}`);
    next(error, req, res);
  }
});

module.exports = router;
