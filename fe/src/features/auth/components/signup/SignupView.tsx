import { Button, Notice } from '../../../../shared/ui';
import { validateSignup, validateSignupId } from '../../lib/signupValidation';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import type { Gender, ReadingAmount, SignupForm } from '../../types/signup';

import AccountSection, { type IdCheckStatus } from './AccountSection';
import EmailSection from './EmailSection';
import NicknameSection from './NicknameSection';
import PasswordSection from './PasswordSection';
import ProfileSection from './ProfileSection';
import ReadingPreferenceSection from './ReadingPreferenceSection';

import styles from './SignupView.module.css';
import { api, ApiError } from '../../lib/api/api';
import { useAuth } from '../../hooks/useAuth';

const INITIAL_FORM: SignupForm = {
  user_id: '',
  password: '',
  passwordConfirm: '',
  emailId: '',
  emailDomain: '',
  name: '',
  gender: '',
  age_group: '',
  genres: [],
  readingAmount: '',
};

// 기존 중복 AuthResponse 선언 삭제 (api.ts의 응답 타입 사용)

function SignupView() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<SignupForm>(INITIAL_FORM);
  const [idMessage, setIdMessage] = useState('');
  const [idStatus, setIdStatus] = useState<IdCheckStatus>('idle');
  // 중복확인을 통과한 아이디. 기존 count(0/1) 방식은 확인 후 아이디를 바꿔도 0이 남아 미확인 아이디로 가입 가능했음
  const [checkedId, setCheckedId] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleChange = <K extends keyof SignupForm>(field: K, value: SignupForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUserIdChange = (value: string) => {
    handleChange('user_id', value);
    // 아이디가 바뀌면 기존 확인 결과 무효
    setCheckedId('');
    setIdStatus('idle');
    setIdMessage(value ? '아이디 중복확인을 해 주세요.' : '');
  };

  const handleUserIdCheck = async () => {
    // 요청 중 입력이 바뀌어도 확인한 값 기준으로 기록
    const target = form.user_id;

    // 기존엔 형식 오류여도 API를 호출하고, 형식이 맞아도 오류 문구를 먼저 표시했음
    const idError = validateSignupId(target);
    if (idError) {
      setIdStatus('error');
      setIdMessage(idError);
      return;
    }

    setChecking(true);
    try {
      const { count } = await api.checkUserId(target);
      if (count === 0) {
        setCheckedId(target);
        setIdStatus('available');
        setIdMessage('사용 가능한 아이디입니다.');
      } else {
        setIdStatus('error');
        setIdMessage('이미 사용 중인 아이디입니다.');
      }
    } catch (err) {
      // 기존엔 서버·네트워크 오류도 "이미 사용 중"으로 표시했음 → 실제 오류 메시지 표시
      setIdStatus('error');
      setIdMessage(err instanceof Error ? err.message : '아이디 확인 중 오류가 발생했습니다.');
    } finally {
      setChecking(false);
    }
  };

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    // 중복 제출 방지
    if (submitting) return;

    // 검증 실패 시 submitting을 켜기 전에 반환
    // 기존엔 submitting=true 후 return해 버튼이 '가입중...'에 멈췄음
    const signupError = validateSignup(form);
    if (signupError) {
      setMessage(signupError);
      return;
    }
    if (checkedId !== form.user_id) {
      setMessage('아이디 중복확인을 해 주세요.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    // 비밀번호가 포함된 폼 전체를 console.log 하던 코드 삭제
    try {
      await api.signUp({
        user_id: form.user_id,
        password: form.password,
        email: `${form.emailId.trim()}@${form.emailDomain}`,
        name: form.name.trim(),
        // validateSignup에서 빈 값을 막았으므로 단언 가능
        gender: form.gender as Gender,
        age_group: form.age_group,
        // 기존 join(',') 문자열 → 배열 그대로
        genres: form.genres,
        readingAmount: form.readingAmount as ReadingAmount,
      });
      // 로그인 화면에서 완료 안내 + 아이디 미리 채움
      navigate('/login', { replace: true, state: { signedUpId: form.user_id } });
    } catch (err) {
      // 그 사이 다른 사람이 아이디를 선점한 경우 재확인 유도
      if (err instanceof ApiError && err.status === 409) {
        setCheckedId('');
        setIdStatus('idle');
      }
      // 기존엔 BE 메시지를 버리고 고정 문구만 표시했음
      setMessage(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      // 기존엔 여기서 항상 '회원가입이 완료되었습니다.'로 덮어써 실패도 성공처럼 보였음
      setSubmitting(false);
    }
  }

  // 로그인 상태에서 가입 화면 접근 차단
  if (user) return <Navigate to="/" replace />;

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

      <form className={styles.content} onSubmit={handleSubmit}>
        <AccountSection
          user_id={form.user_id}
          message={idMessage}
          status={idStatus}
          checking={checking}
          onUserIdChange={handleUserIdChange}
          onUserIdCheck={handleUserIdCheck}
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

        <NicknameSection name={form.name} onNameChange={(value) => handleChange('name', value)} />

        <ProfileSection
          gender={form.gender}
          age_group={form.age_group}
          onGenderChange={(value) => handleChange('gender', value)}
          onAgeGroupChange={(value) => handleChange('age_group', value)}
        />

        <ReadingPreferenceSection
          genres={form.genres}
          readingAmount={form.readingAmount}
          onGenreChange={(value) => handleChange('genres', value)}
          onReadingAmountChange={(value) => handleChange('readingAmount', value)}
        />

        <Button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? '가입중...' : '가입하기'}
        </Button>
        {message && <Notice>{message}</Notice>}
      </form>
    </div>
  );
}

export default SignupView;
