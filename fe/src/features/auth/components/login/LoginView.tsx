import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Field,
  TextInput,
  Button,
  PageHeading,
  PageContainer,
  FormSection,
  Notice,
} from '../../../../shared/ui';
export default function LoginView() {
  const [message, setMessage] = useState('');
  return (
    <PageContainer narrow>
      <PageHeading
        eyebrow="WELCOME BACK"
        title="다시 만나 반가워요."
        description="로그인하고 이어서 항해해요."
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setMessage('로그인은 아직 준비 중입니다. 로그인되지 않았습니다.');
        }}
      >
        <FormSection title="로그인">
          <Field label="이메일" required>
            <TextInput type="email" name="email" autoComplete="email" required />
          </Field>
          <Field label="비밀번호" required>
            <TextInput type="password" name="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit">로그인</Button>
          <Button
            variant="secondary"
            onClick={() => setMessage('비밀번호 찾기는 아직 준비 중입니다.')}
          >
            비밀번호 찾기
          </Button>
        </FormSection>
        {message && <Notice>{message}</Notice>}
      </form>
      <p>
        아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </PageContainer>
  );
}
