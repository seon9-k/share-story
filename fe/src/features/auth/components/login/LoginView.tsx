import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Field,
  TextInput,
  Button,
  PageHeading,
  PageContainer,
  FormSection,
  Notice,
} from '../../../../shared/ui';

// RequireAuth가 넘기는 from, 회원가입 완료 후 넘기는 signedUpId
interface LoginLocationState {
  from?: string;
  signedUpId?: string;
}

export default function LoginView() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const from = state?.from ?? '/';
  // 가입 직후면 아이디 미리 채움
  const [user_id, setUserId] = useState(state?.signedUpId ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 오타 수정: hanldeSubmit → handleSubmit
  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      await login(user_id, password);
      navigate(from, { replace: true });
    } catch (e) {
      // alert 대신 화면에 표시, BE 메시지(아이디 또는 비밀번호 불일치 등) 사용
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  // 이미 로그인 상태면 원래 가려던 곳으로 이동
  if (user) return <Navigate to={from} replace />;

  return (
    <PageContainer narrow>
      <PageHeading
        eyebrow="WELCOME BACK"
        title="다시 만나 반가워요."
        description="로그인하고 이어서 항해해요."
      />

      {state?.signedUpId && <Notice>회원가입이 완료되었습니다. 로그인해 주세요.</Notice>}

      <form onSubmit={handleSubmit}>
        <FormSection title="로그인">
          <Field label="아이디" required>
            <TextInput
              type="text"
              name="user_id"
              // 'user_id'는 유효한 autocomplete 값이 아님 → username
              autoComplete="username"
              required
              onChange={(e) => setUserId(e.target.value)}
              placeholder="아이디를 입력해 주세요"
              value={user_id}
            />
          </Field>
          <Field label="비밀번호" required>
            <TextInput
              type="password"
              name="password"
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해 주세요"
              value={password}
            />
          </Field>

          <Button type="submit" disabled={submitting}>
            {submitting ? '로그인중...' : '로그인'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setMessage('비밀번호 찾기는 아직 준비 중입니다.')}
          >
            비밀번호 찾기
          </Button>
        </FormSection>

        {error && <Notice>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
      </form>

      <p>
        아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </PageContainer>
  );
}
