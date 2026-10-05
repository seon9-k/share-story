import { MAX_GENRES, type SignupForm } from '../types/signup';

// 규칙은 BE be/src/modules/auth/auth.validation.js와 동일하게 유지

// 영문+숫자 포함 4~10자 (기존 1~10자 → 4~10자)
export function validateSignupId(user_id: string): string | undefined {
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,10}$/.test(user_id))
    return '아이디는 영문과 숫자를 포함해 4~10자로 입력해 주세요.';
}

// 기존엔 아이디·비밀번호·이메일·닉네임만 검사해 나머지는 BE에서 실패했음 → 전 항목 검사
export function validateSignup(form: SignupForm): string | undefined {
  const idError = validateSignupId(form.user_id);
  if (idError) return idError;

  // 기존엔 빈 값만 막아 1자 비밀번호도 통과했음
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(form.password))
    return '비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.';
  if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다.';

  if (!form.emailDomain) return '이메일 도메인을 선택해 주세요.';
  const email = `${form.emailId.trim()}@${form.emailDomain}`;
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return '이메일을 확인해 주세요.';

  const name = form.name.trim();
  if (!name) return '닉네임을 입력해 주세요.';
  if (name.length > 50) return '닉네임은 50자 이하로 입력해 주세요.';

  if (!form.gender) return '성별을 선택해 주세요.';
  if (!form.age_group) return '연령대를 선택해 주세요.';
  if (form.genres.length > MAX_GENRES)
    return `선호 장르는 최대 ${MAX_GENRES}개까지 선택할 수 있습니다.`;
  if (!form.readingAmount) return '한달 독서량을 선택해 주세요.';
}
