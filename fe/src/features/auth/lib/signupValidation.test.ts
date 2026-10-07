import { describe, expect, it } from 'vitest';
import { validateSignup, validateSignupId } from './signupValidation';
import type { SignupForm } from '../types/signup';

const form = (over: Partial<SignupForm> = {}): SignupForm => ({
  user_id: 'reader01',
  password: 'password1',
  passwordConfirm: 'password1',
  emailId: 'reader',
  emailDomain: 'example.com',
  name: '독서왕',
  gender: 'F',
  age_group: '30대',
  genres: ['NOVEL', 'ESSAY'],
  readingAmount: 'BOOKS_3_4',
  ...over,
});

describe('회원가입 입력 검증 (REQ-MEM-002)', () => {
  it('정상 입력이면 오류가 없음', () => {
    expect(validateSignup(form())).toBeUndefined();
  });

  it('선호 장르는 0개여도 허용함', () => {
    expect(validateSignup(form({ genres: [] }))).toBeUndefined();
  });

  it.each([
    ['3자', 'ab1', false],
    ['4자', 'ab12', true],
    ['10자', 'abcde12345', true],
    ['11자', 'abcde123456', false],
    ['숫자 없음', 'abcdef', false],
    ['영문 없음', '123456', false],
    ['특수문자 포함', 'abc_123', false],
  ])('아이디 %s → 통과 %s', (_label, id, ok) => {
    expect(validateSignupId(id) === undefined).toBe(ok);
  });

  it.each([
    ['7자', 'pass123', false],
    ['8자', 'pass1234', true],
    ['숫자 없음', 'passwordonly', false],
    ['영문 없음', '12345678', false],
  ])('비밀번호 %s → 통과 %s', (_label, password, ok) => {
    const result = validateSignup(form({ password, passwordConfirm: password }));
    expect(result === undefined).toBe(ok);
  });

  it('비밀번호 확인이 다르면 오류', () => {
    expect(validateSignup(form({ passwordConfirm: 'different1' }))).toBe('비밀번호가 일치하지 않습니다.');
  });

  it('이메일 도메인 미선택·형식 오류를 구분함', () => {
    expect(validateSignup(form({ emailDomain: '' }))).toBe('이메일 도메인을 선택해 주세요.');
    expect(validateSignup(form({ emailId: 'a b' }))).toBe('이메일을 확인해 주세요.');
  });

  it('닉네임은 공백만이면 오류, 50자 초과도 오류', () => {
    expect(validateSignup(form({ name: '   ' }))).toBe('닉네임을 입력해 주세요.');
    expect(validateSignup(form({ name: 'a'.repeat(51) }))).toContain('50자 이하');
    expect(validateSignup(form({ name: 'a'.repeat(50) }))).toBeUndefined();
  });

  it('성별·연령대·독서량이 비어 있으면 각각 오류', () => {
    expect(validateSignup(form({ gender: '' }))).toBe('성별을 선택해 주세요.');
    expect(validateSignup(form({ age_group: '' }))).toBe('연령대를 선택해 주세요.');
    expect(validateSignup(form({ readingAmount: '' }))).toBe('한달 독서량을 선택해 주세요.');
  });

  it('선호 장르는 최대 2개', () => {
    expect(validateSignup(form({ genres: ['NOVEL', 'ESSAY', 'IT'] }))).toContain('최대 2개');
  });
});
