import { FormSection, TextInput, Select } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

interface EmailSectionProps {
  emailId: string;
  emailDomain: string;
  onEmailIdChange: (value: string) => void;
  onEmailDomainChange: (value: string) => void;
}

const EMAIL_DOMAINS = ['gmail.com', 'naver.com', 'kakao.com', 'daum.net'];

function EmailSection({
  emailId,
  emailDomain,
  onEmailIdChange,
  onEmailDomainChange,
}: EmailSectionProps) {
  return (
    <FormSection number={3} title="이메일">
      <div className={styles.row}>
        <TextInput
          id="signup-email-id"
          name="emailId"
          type="text"
          value={emailId}
          onChange={(event) => onEmailIdChange(event.target.value)}
          placeholder="이메일 아이디"
          className={`${styles.input} ${styles.flexInput}`}
          aria-label="이메일 아이디"
        />

        <span className={styles.at} aria-hidden="true">
          @
        </span>

        <Select
          id="signup-email-domain"
          name="emailDomain"
          value={emailDomain}
          onChange={(event) => onEmailDomainChange(event.target.value)}
          className={`${styles.select} ${styles.flexInput}`}
          aria-label="이메일 도메인"
        >
          <option value="">도메인 선택</option>

          {EMAIL_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </Select>
      </div>
    </FormSection>
  );
}

export default EmailSection;
