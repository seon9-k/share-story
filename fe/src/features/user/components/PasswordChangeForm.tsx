import { useState } from 'react';
import { authApi } from '../../auth';
import styles from './ProfileEditForm.module.css';
import { Button, Field, FormSection, Notice, TextInput } from '../../../shared/ui';

// BE auth.validation.js PASSWORD_RE와 동일
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting) return;
        if (!PASSWORD_RE.test(next))
          return setMessage('비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.');
        if (next !== confirm) return setMessage('새 비밀번호가 일치하지 않습니다.');
        setSubmitting(true);
        setMessage('');
        try {
          await authApi.updateMyInfo({ current_password: current, new_password: next });
          setCurrent('');
          setNext('');
          setConfirm('');
          setMessage('비밀번호를 변경했습니다.');
        } catch (error) {
          setMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <FormSection title="비밀번호 변경">
        <Field label="현재 비밀번호" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="새 비밀번호" required hint="영문과 숫자를 포함해 8자 이상">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="새 비밀번호 확인" required>
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
          />
        </Field>
        {message && <Notice>{message}</Notice>}
        <div className={styles.actions}>
          <Button type="submit" disabled={!current || !next || !confirm || submitting}>
            {submitting ? '변경 중…' : '비밀번호 변경'}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
