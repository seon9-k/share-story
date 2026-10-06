const authService = require('./auth.service');
const { validateSignup, validateUpdate, rules, MESSAGES, isText } = require('./auth.validation');

/**
 * [Controller]
 * - 요청(req)에서 필요한 값을 가져옵니다.
 * - Service를 호출합니다.
 * - Service의 처리 결과를 HTTP 응답으로 반환합니다.
 * - 비즈니스 로직은 Service에서 처리합니다.
 */

// Service의 status 에러는 그대로 응답, 나머지는 errorHandler로 전달
const handle = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ success: false, message: error.message });
    // 동시 가입으로 PK/유니크 충돌 시
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }
    return next(error);
  }
};

const badRequest = (res, message) => res.status(400).json({ success: false, message });

// 회원가입
// 기존 console.log(user) 제거 (조회한 회원 정보가 로그에 남았음)
const signUp = handle(async (req, res) => {
  const body = req.body ?? {};
  const error = validateSignup(body);
  if (error) return badRequest(res, error);

  const document = await authService.signUp(body);
  return res.status(201).json({ success: true, document, message: '회원가입이 완료되었습니다.' });
});

// 로그인
// 기존 토큰 console.log 제거, 실패 응답 400 → 401
const login = handle(async (req, res) => {
  const { user_id, password } = req.body ?? {};
  if (!isText(user_id) || typeof password !== 'string' || !password) {
    return badRequest(res, '아이디와 비밀번호를 입력해 주세요.');
  }

  const { token, user } = await authService.login({ user_id, password });
  return res
    .status(200)
    .json({ success: true, token, document: user, message: '로그인되었습니다.' });
});

// 아이디 중복확인
// 기존 이름 getMyInfo는 "내 정보 조회"로 오해 → checkUserId로 변경
const checkUserId = handle(async (req, res) => {
  const { user_id } = req.body ?? {};
  // 형식이 틀린 아이디는 조회하지 않음
  if (!rules.user_id(user_id)) return badRequest(res, MESSAGES.user_id);

  const count = (await authService.isUserIdTaken(user_id)) ? 1 : 0;
  return res.status(200).json({
    success: true,
    count,
    message: count === 0 ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.',
  });
});

// 회원정보 수정 (authorization 미들웨어 필수)
// body.user_id는 무시하고 토큰의 req.user_id만 사용
const updateMyInfo = handle(async (req, res) => {
  const body = req.body ?? {};
  const error = validateUpdate(body);
  if (error) return badRequest(res, error);

  const document = await authService.updateMyInfo(req.user_id, body);
  return res.status(200).json({ success: true, document, message: '회원정보가 수정되었습니다.' });
});

// 회원탈퇴 (authorization 미들웨어 필수). 토큰의 본인만 탈퇴
const withdraw = handle(async (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password)
    return badRequest(res, '비밀번호를 입력해 주세요.');

  await authService.withdraw(req.user_id, password);
  return res.status(200).json({ success: true, message: '회원탈퇴가 완료되었습니다.' });
});

// 기존 getAuth는 라우트에 연결되지 않았고 /member/me와 중복이라 삭제
module.exports = { signUp, login, checkUserId, updateMyInfo, withdraw };
