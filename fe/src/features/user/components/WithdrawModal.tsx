import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Button, Field, Notice, TextInput } from '../../../shared/ui';
import styles from './WithdrawModal.module.css';

// 회원탈퇴 모달: 안내 + 비밀번호 재확인 후 탈퇴. 모달 자체가 최종 확인 역할
export default function WithdrawModal({ onClose }: { onClose: () => void }) {
  const { withdraw, logout } = useAuth();
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 네이티브 dialog의 showModal이 포커스 가두기·Esc 닫기·배경 비활성화를 처리
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby={titleId}
      // 탈퇴 처리 중에는 Esc로 닫히지 않게 함
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting) onClose();
      }}
      onClick={(event) => {
        // 배경(dialog 자신) 클릭 시 닫기
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        className={styles.body}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!password || submitting) return;
          setSubmitting(true);
          setError('');
          try {
            await withdraw(password);
            // 홈 이동을 즉시 반영(flushSync)한 뒤 로그아웃
            // 순서가 바뀌거나 이동이 늦게 반영되면 RequireAuth가 로그인 화면으로 보냄
            await navigate('/', { replace: true, flushSync: true });
            // 탈퇴한 계정 토큰은 만료 전까지 유효하므로 즉시 삭제
            logout();
          } catch (err) {
            // 진행 중 모임이 있으면 BE가 409와 사유를 반환
            setError(err instanceof Error ? err.message : '회원탈퇴에 실패했습니다.');
            setSubmitting(false);
          }
        }}
      >
        <h2 id={titleId} className={styles.title}>
          회원탈퇴
        </h2>
        <p className={styles.text}>
          탈퇴하면 로그인할 수 없고 아이디는 다시 사용할 수 없습니다. 작성한 로그북과 후기는 모임
          기록으로 남으며 &apos;탈퇴한 회원&apos;으로 표시됩니다. 참여 중이거나 운영 중인 모임이
          있으면 끝난 뒤 탈퇴할 수 있습니다.
        </p>
        <Field label="비밀번호 확인" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            autoFocus
          />
        </Field>
        {error && <Notice>{error}</Notice>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="submit" disabled={!password || submitting}>
            {submitting ? '탈퇴 처리 중…' : '회원탈퇴'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
