import { FormSection, Button, TextInput, Notice } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

interface AccountSectionProps {
  id: string;
  message: string;
  onIdChange: (value: string) => void;
  onIdCheck: () => void;
}

function AccountSection({ id, message, onIdChange, onIdCheck }: AccountSectionProps) {
  return (
    <FormSection number={1} title="아이디">
      <div className={styles.row}>
        <TextInput
          aria-label="아이디"
          id="signup-id"
          name="id"
          type="text"
          value={id}
          onChange={(event) => onIdChange(event.target.value)}
          placeholder="아이디를 입력해 주세요"
          className={`${styles.input} ${styles.flexInput}`}
          autoComplete="username"
        />

        <Button type="button" className={styles.checkButton} onClick={onIdCheck}>
          중복확인
        </Button>
      </div>

      {message && <Notice>{message}</Notice>}

      <p className={styles.helpText}>영문·숫자 조합 10자리 이하</p>
    </FormSection>
  );
}

export default AccountSection;
