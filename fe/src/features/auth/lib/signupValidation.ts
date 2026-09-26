import type { SignupForm } from '../types/signup';
export function validateSignupId(id: string): string | undefined {
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,10}$/.test(id))
    return '아이디는 영문과 숫자를 포함해 10자리 이하로 입력해 주세요.';
}
export function validateSignup(form: SignupForm): string | undefined {
  const idError = validateSignupId(form.id);
  if (idError) return idError;
  if (!form.password) return '비밀번호를 입력해 주세요.';
  if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${form.emailId}@${form.emailDomain}`))
    return '이메일을 확인해 주세요.';
  if (!form.nickname.trim()) return '닉네임을 입력해 주세요.';
}
