/**
 * [Validation]
 * - 회원가입/회원정보 수정 입력값 검사.
 * - 기존에는 user_id/password/name만 확인하고 나머지는 DB 제약에 맡겨
 *   ENUM 오류가 500, 형식 오류가 영어 메시지로 나갔음 → BE에서 직접 검사하도록 분리.
 * - 규칙은 FE features/auth/lib/signupValidation.ts와 동일하게 유지.
 */

// models/User.js ENUM과 동일해야 함
const GENRES = [
  'NOVEL',
  'ECONOMY_BUSINESS',
  'SELF_DEVELOPMENT',
  'IT',
  'ESSAY',
  'TRAVEL_LIFESTYLE',
  'PARENT_CHILD',
  'HUMANITIES_PHILOSOPHY',
  'SOCIETY',
  'SCIENCE',
  'HISTORY',
  'ETC',
];
const READING_AMOUNTS = ['BOOKS_1_2', 'BOOKS_3_4', 'BOOKS_5_6', 'BOOKS_7_PLUS'];
const GENDERS = ['M', 'F'];
// 우선 연령대로 받음 (생년월일 전환 시 DB 컬럼부터 변경 필요)
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
// genre_1, genre_2 두 컬럼만 있음
const MAX_GENRES = 2;

// 영문+숫자 포함 4~10자 (기존 FE 1~10자 → 4~10자로 변경)
const USER_ID_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,10}$/;
// 영문+숫자 포함 8~64자 (기존 규칙 없음, 1자도 통과했음)
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  user_id: '아이디는 영문과 숫자를 포함해 4~10자로 입력해 주세요.',
  password: '비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.',
  email: '이메일 형식을 확인해 주세요.',
  name: '닉네임은 1~50자로 입력해 주세요.',
  gender: '성별을 선택해 주세요.',
  age_group: '연령대를 선택해 주세요.',
  readingAmount: '한달 독서량을 선택해 주세요.',
  genres: `선호 장르는 최대 ${MAX_GENRES}개까지 중복 없이 선택해 주세요.`,
};

const isText = (value) => typeof value === 'string' && value.trim() !== '';

// 필드별 검사, 통과 시 true
const rules = {
  user_id: (v) => isText(v) && USER_ID_RE.test(v),
  password: (v) => typeof v === 'string' && PASSWORD_RE.test(v),
  email: (v) => isText(v) && v.length <= 100 && EMAIL_RE.test(v),
  name: (v) => isText(v) && v.trim().length <= 50,
  gender: (v) => GENDERS.includes(v),
  age_group: (v) => AGE_GROUPS.includes(v),
  readingAmount: (v) => READING_AMOUNTS.includes(v),
  // 기존 FE가 "NOVEL,ESSAY" 문자열을 보내 genres[0]이 'N'으로 저장되던 문제 → 배열만 허용
  genres: (v) =>
    Array.isArray(v) &&
    v.length <= MAX_GENRES &&
    v.every((g) => GENRES.includes(g)) &&
    new Set(v).size === v.length,
};

const SIGNUP_FIELDS = [
  'user_id',
  'password',
  'email',
  'name',
  'gender',
  'age_group',
  'readingAmount',
  'genres',
];
const UPDATE_FIELDS = ['email', 'name', 'gender', 'age_group', 'readingAmount', 'genres'];

// 회원가입: 모든 필드 필수, 첫 오류 메시지 반환
function validateSignup(body) {
  const failed = SIGNUP_FIELDS.find((field) => !rules[field](body[field]));
  return failed ? MESSAGES[failed] : undefined;
}

// 회원정보 수정: 보낸 필드만 검사 (부분 수정)
function validateUpdate(body) {
  const sent = UPDATE_FIELDS.filter((field) => body[field] !== undefined);
  const hasPasswordChange = body.new_password !== undefined;
  if (sent.length === 0 && !hasPasswordChange) return '수정할 항목이 없습니다.';

  const failed = sent.find((field) => !rules[field](body[field]));
  if (failed) return MESSAGES[failed];

  if (hasPasswordChange) {
    if (!rules.password(body.new_password)) return MESSAGES.password;
    // 비밀번호 변경은 토큰 탈취 대비로 현재 비밀번호 재확인
    if (typeof body.current_password !== 'string' || !body.current_password)
      return '현재 비밀번호를 입력해 주세요.';
  }
}

module.exports = {
  GENRES,
  READING_AMOUNTS,
  GENDERS,
  AGE_GROUPS,
  MAX_GENRES,
  MESSAGES,
  isText,
  rules,
  validateSignup,
  validateUpdate,
};
