import { Button, Notice } from '../../../../shared/ui';
import { validateSignup, validateSignupId } from '../../lib/signupValidation';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { SignupForm } from '../../types/signup';

import AccountSection from './AccountSection';
import EmailSection from './EmailSection';
import NicknameSection from './NicknameSection';
import PasswordSection from './PasswordSection';
import ProfileSection from './ProfileSection';
import ReadingPreferenceSection from './ReadingPreferenceSection';

import styles from './SignupView.module.css';

const INITIAL_FORM: SignupForm = {
  id: '',
  password: '',
  passwordConfirm: '',
  emailId: '',
  emailDomain: '',
  nickname: '',
  gender: '',
  birthday: '',
  categories: [],
  readingAmount: '',
};

function SignupView() {
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<SignupForm>(INITIAL_FORM);

  const [idMessage, setIdMessage] = useState('');

  const handleChange = <K extends keyof SignupForm>(field: K, value: SignupForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIdChange = (value: string) => {
    handleChange('id', value);

    // 아이디가 변경되면 기존 중복 확인 결과는 무효
    setIdMessage('');
  };

  const handleIdCheck = () => {
    setIdMessage(
      validateSignupId(form.id) ??
        '아이디 중복 확인은 아직 준비 중입니다. 사용 가능 여부가 확인되지 않았습니다.',
    );
  };
  const handleSubmit = () => {
    setMessage(
      validateSignup(form) ?? '회원가입은 아직 준비 중입니다. 계정이 생성되지 않았습니다.',
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <Link to="/login" className={styles.backLink}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            돌아가기
          </Link>

          <p className={styles.eyebrow}>회원가입</p>

          <h1 className={styles.title}>항해를 시작하세요</h1>

          <p className={styles.description}>계정과 사용자 정보를 입력해 주세요.</p>
        </div>
      </header>

      <form
        className={styles.content}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <AccountSection
          id={form.id}
          message={idMessage}
          onIdChange={handleIdChange}
          onIdCheck={handleIdCheck}
        />

        <PasswordSection
          password={form.password}
          passwordConfirm={form.passwordConfirm}
          onPasswordChange={(value) => handleChange('password', value)}
          onPasswordConfirmChange={(value) => handleChange('passwordConfirm', value)}
        />

        <EmailSection
          emailId={form.emailId}
          emailDomain={form.emailDomain}
          onEmailIdChange={(value) => handleChange('emailId', value)}
          onEmailDomainChange={(value) => handleChange('emailDomain', value)}
        />

        <NicknameSection
          nickname={form.nickname}
          onChange={(value) => handleChange('nickname', value)}
        />

        <ProfileSection
          gender={form.gender}
          birthday={form.birthday}
          onGenderChange={(value) => handleChange('gender', value)}
          onBirthdayChange={(value) => handleChange('birthday', value)}
        />

        <ReadingPreferenceSection
          categories={form.categories}
          readingAmount={form.readingAmount}
          onCategoriesChange={(value) => handleChange('categories', value)}
          onReadingAmountChange={(value) => handleChange('readingAmount', value)}
        />

        <Button type="submit" className={styles.submitButton}>
          가입하기
        </Button>
        {message && <Notice>{message}</Notice>}
      </form>
    </div>
  );
}

export default SignupView;
