// 값은 BE ENUM 코드, 화면엔 label만 한글로 표시
// 기존 '남'/'여'를 그대로 보내 BE ENUM('M','F') 오류(500)가 났음
export type Gender = 'M' | 'F';
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'M', label: '남' },
  { value: 'F', label: '여' },
];

export type PreferredGenre =
  | 'NOVEL'
  | 'ECONOMY_BUSINESS'
  | 'SELF_DEVELOPMENT'
  | 'IT'
  | 'ESSAY'
  | 'TRAVEL_LIFESTYLE'
  | 'PARENT_CHILD'
  | 'HUMANITIES_PHILOSOPHY'
  | 'SOCIETY'
  | 'SCIENCE'
  | 'HISTORY'
  | 'ETC';

// BE monthly_reading_volume ENUM과 동일
// 기존 '1~2권' 등 한글 값 전송으로 ENUM 오류, '3~4권'/'4~5권' 구간도 겹쳤음
export type ReadingAmount = 'BOOKS_1_2' | 'BOOKS_3_4' | 'BOOKS_5_6' | 'BOOKS_7_PLUS';
export const READING_AMOUNT_OPTIONS: { value: ReadingAmount; label: string }[] = [
  { value: 'BOOKS_1_2', label: '1~2권' },
  { value: 'BOOKS_3_4', label: '3~4권' },
  { value: 'BOOKS_5_6', label: '5~6권' },
  { value: 'BOOKS_7_PLUS', label: '7권 이상' },
];

// 우선 연령대로 받음 (DB age_group·seed 기준). BE auth.validation.js AGE_GROUPS와 동일
export const AGE_GROUP_OPTIONS = ['20대', '30대', '40대', '50대', '60대 이상'] as const;

// BE는 genre_1, genre_2 두 칸만 저장
export const MAX_GENRES = 2;

export interface SignupForm {
  user_id: string;
  password: string;
  passwordConfirm: string;

  emailId: string;
  emailDomain: string;

  name: string;

  gender: Gender | '';
  age_group: string;

  genres: PreferredGenre[];
  readingAmount: ReadingAmount | '';
}

// 로그인 응답 document (비밀번호 해시 없음)
// 기존엔 로그인 사용자를 SignupForm 타입(비밀번호 필드 포함)으로 저장했음
export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
  gender: Gender;
  age_group: string;
  monthly_reading_volume: ReadingAmount;
  genre_1: PreferredGenre | null;
  genre_2: PreferredGenre | null;
}
