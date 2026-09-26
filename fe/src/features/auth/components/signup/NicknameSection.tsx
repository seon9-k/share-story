import { FormSection, TextInput } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

interface NicknameSectionProps {
  nickname: string;
  onChange: (value: string) => void;
}

function NicknameSection({ nickname, onChange }: NicknameSectionProps) {
  return (
    <FormSection number={4} title="닉네임">
      <TextInput
        id="signup-nickname"
        aria-label="닉네임"
        name="nickname"
        type="text"
        value={nickname}
        onChange={(event) => onChange(event.target.value)}
        placeholder="닉네임을 입력해 주세요"
        className={styles.input}
        autoComplete="nickname"
      />
    </FormSection>
  );
}

export default NicknameSection;
