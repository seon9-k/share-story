const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../../models');

/**
 * [Service]
 * - User와 관련된 비즈니스 로직을 처리합니다.
 * - 필요한 경우 Model을 통해 DB에 접근합니다.
 * - HTTP 요청/응답 객체(req, res)는 직접 다루지 않습니다.
 * - 기존에는 로직이 Controller에 있었음 → 위 구조에 맞게 Service로 이동.
 */

// 컨트롤러가 status로 응답하도록 에러에 상태코드 부여
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

// 기존 SALT_ROUND를 읽어 .env의 SALT_ROUNDS가 무시되던 문제 수정
const saltRounds = () => Number.parseInt(process.env.SALT_ROUNDS, 10) || 10;

// JWT 만료 하루 (기존 만료 없음 → 탈취 토큰이 영구 유효했음)
// 환경별 조정은 JWT_EXPIRES_IN으로 가능
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// 응답용 회원 정보. 기존 로그인 응답은 모델 전체를 반환해 비밀번호 해시까지 노출됐음
const toPublicUser = (user) => ({
  user_id: user.user_id,
  name: user.name,
  email: user.email,
  gender: user.gender,
  age_group: user.age_group,
  monthly_reading_volume: user.monthly_reading_volume,
  genre_1: user.genre_1,
  genre_2: user.genre_2,
});

// 탈퇴(soft delete) 회원 아이디도 PK라 재사용 불가 → paranoid:false로 포함 조회
const isUserIdTaken = async (user_id) =>
  (await User.count({ where: { user_id }, paranoid: false })) > 0;

// 이메일 중복 가입 금지 (excludeUserId: 수정 시 본인 제외)
const isEmailTaken = async (email, excludeUserId) => {
  const where = { email };
  if (excludeUserId) where.user_id = { [Op.ne]: excludeUserId };
  return (await User.count({ where })) > 0;
};

// 회원가입 (입력값은 validateSignup 통과 전제)
const signUp = async ({
  user_id,
  password,
  email,
  name,
  gender,
  age_group,
  readingAmount,
  genres,
}) => {
  if (await isUserIdTaken(user_id)) fail(409, '이미 사용 중인 아이디입니다.');
  if (await isEmailTaken(email)) fail(409, '이미 가입된 이메일입니다.');

  const user = await User.create({
    user_id,
    password: await bcrypt.hash(password, saltRounds()),
    email,
    name: name.trim(),
    gender,
    age_group,
    monthly_reading_volume: readingAmount,
    genre_1: genres[0] ?? null,
    genre_2: genres[1] ?? null,
    // 감사 컬럼은 클라이언트 값 대신 가입 아이디로 고정 (기존엔 body 값도 받았음)
    created_user_id: user_id,
    updated_user_id: user_id,
  });

  return { user_id: user.user_id, name: user.name };
};

// 로그인
const login = async ({ user_id, password }) => {
  const user = await User.findOne({ where: { user_id } });
  // 소셜 회원은 password가 null → bcrypt.compare 예외(500) 방지
  const matched = user?.password ? await bcrypt.compare(password, user.password) : false;
  // 아이디/비밀번호 중 무엇이 틀렸는지 구분하지 않음 (계정 존재 여부 노출 방지)
  if (!matched) fail(401, '아이디 또는 비밀번호가 올바르지 않습니다.');

  const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // 하루
  });

  return { token, user: toPublicUser(user) };
};

// 회원정보 수정. userId는 토큰에서 꺼낸 값만 사용
// 기존: 인증 없이 body.user_id로 남의 정보 수정 가능, 수정 후 비밀번호 비교, 미정의 token 참조
const updateMyInfo = async (userId, body) => {
  const user = await User.findByPk(userId);
  if (!user) fail(404, '존재하지 않는 사용자입니다.');

  const changes = {};
  if (body.email !== undefined && body.email !== user.email) {
    if (await isEmailTaken(body.email, userId)) fail(409, '이미 가입된 이메일입니다.');
    changes.email = body.email;
  }
  if (body.name !== undefined) changes.name = body.name.trim();
  if (body.gender !== undefined) changes.gender = body.gender;
  if (body.age_group !== undefined) changes.age_group = body.age_group;
  if (body.readingAmount !== undefined) changes.monthly_reading_volume = body.readingAmount;
  if (body.genres !== undefined) {
    changes.genre_1 = body.genres[0] ?? null;
    changes.genre_2 = body.genres[1] ?? null;
  }

  if (body.new_password !== undefined) {
    // 변경 전 현재 비밀번호 확인 (수정보다 먼저 검사)
    const matched = user.password
      ? await bcrypt.compare(body.current_password, user.password)
      : false;
    // 401이면 FE가 토큰 만료로 보고 로그아웃하므로 400 사용
    if (!matched) fail(400, '현재 비밀번호가 올바르지 않습니다.');
    changes.password = await bcrypt.hash(body.new_password, saltRounds());
  }

  changes.updated_user_id = userId;
  await user.update(changes);
  return toPublicUser(user);
};

module.exports = { isUserIdTaken, signUp, login, updateMyInfo, toPublicUser };
