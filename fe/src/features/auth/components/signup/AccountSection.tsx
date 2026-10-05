import { FormSection, Button, TextInput } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

// 중복확인 결과 상태 (메시지 색 구분용)
export type IdCheckStatus = 'idle' | 'available' | 'error';

interface AccountSectionProps {
  user_id: string;
  message: string;
  status: IdCheckStatus;
  checking: boolean;
  onUserIdChange: (value: string) => void;
  onUserIdCheck: () => void;
}

function AccountSection({
  user_id,
  message,
  status,
  checking,
  onUserIdChange,
  onUserIdCheck,
}: AccountSectionProps) {
  return (
    <FormSection number={1} title="아이디">
      <div className={styles.row}>
        <TextInput
          aria-label="아이디"
          id="user_id"
          name="user_id"
          type="text"
          value={user_id}
          onChange={(event) => onUserIdChange(event.target.value)}
          placeholder="아이디를 입력해 주세요"
          className={`${styles.input} ${styles.flexInput}`}
          // 'user_id'는 유효한 autocomplete 값이 아님 → username
          autoComplete="username"
          maxLength={10}
          aria-invalid={status === 'error'}
          aria-describedby={message ? 'user-id-message' : undefined}
        />

        {/* 확인 중 중복 클릭 방지 */}
        <Button
          type="button"
          className={styles.checkButton}
          onClick={onUserIdCheck}
          disabled={checking || !user_id}
        >
          {checking ? '확인중...' : '중복확인'}
        </Button>
      </div>

      {/* 기존 Notice 하나로 성공/실패 구분 없이 표시 → 색으로 구분 */}
      {message && (
        <p
          id="user-id-message"
          role="status"
          className={status === 'available' ? styles.successText : styles.errorText}
        >
          {message}
        </p>
      )}

      <p className={styles.helpText}>영문·숫자 조합 4~10자</p>
    </FormSection>
  );
}

export default AccountSection;
