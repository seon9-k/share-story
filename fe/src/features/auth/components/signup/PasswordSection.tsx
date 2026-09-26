import { FormSection, TextInput } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

interface PasswordSectionProps {
  password: string;
  passwordConfirm: string;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
}

function PasswordSection({
  password,
  passwordConfirm,
  onPasswordChange,
  onPasswordConfirmChange,
}: PasswordSectionProps) {
  const isPasswordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <FormSection number={2} title="비밀번호 / 비밀번호 확인">
      <div className={styles.fieldGroup}>
        <TextInput
          id="signup-password"
          aria-label="비밀번호"
          name="password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="비밀번호"
          className={styles.input}
          autoComplete="new-password"
        />

        <TextInput
          id="signup-password-confirm"
          aria-label="비밀번호 확인"
          name="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => onPasswordConfirmChange(event.target.value)}
          placeholder="비밀번호 확인"
          className={`${styles.input} ${isPasswordMismatch ? styles.inputError : ''}`}
          autoComplete="new-password"
          aria-invalid={isPasswordMismatch}
          aria-describedby={isPasswordMismatch ? 'password-mismatch-message' : undefined}
        />

        {isPasswordMismatch && (
          <p id="password-mismatch-message" className={styles.errorText}>
            비밀번호가 일치하지 않습니다.
          </p>
        )}
      </div>

      <p className={styles.helpText}>다른 서비스와 겹치지 않는 긴 비밀번호를 사용해 주세요.</p>
    </FormSection>
  );
}

export default PasswordSection;
