import { FormSection, TextInput } from '../../../../shared/ui';
import styles from './SignupFormSection.module.css';

interface NicknameSectionProps {
  name: string;
  onNameChange: (value: string) => void;
}

function NicknameSection({ name, onNameChange }: NicknameSectionProps) {
  return (
    <FormSection title="닉네임">
      <TextInput
        id="name"
        aria-label="닉네임"
        name="name"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="닉네임을 입력해 주세요"
        className={styles.input}
        autoComplete="name"
      />
    </FormSection>
  );
}

export default NicknameSection;
