import { FormSection, TextInput } from '../../../../shared/ui';
import type { Gender } from '../../types/signup';

import styles from './SignupFormSection.module.css';

interface ProfileSectionProps {
  gender: Gender | '';
  birthday: string;

  onGenderChange: (value: Gender) => void;
  onBirthdayChange: (value: string) => void;
}

const GENDERS: Gender[] = ['남', '여'];

function ProfileSection({
  gender,
  birthday,
  onGenderChange,
  onBirthdayChange,
}: ProfileSectionProps) {
  return (
    <FormSection number={5} title="성별 / 생년월일">
      <div className={styles.fieldGroup}>
        <div className={styles.row}>
          {GENDERS.map((genderOption) => {
            const isSelected = gender === genderOption;

            return (
              <button
                key={genderOption}
                type="button"
                className={`${styles.equalOptionButton} ${
                  isSelected ? styles.equalOptionButtonSelected : ''
                }`}
                onClick={() => onGenderChange(genderOption)}
                aria-pressed={isSelected}
              >
                {genderOption}
              </button>
            );
          })}
        </div>

        <TextInput
          id="signup-birthday"
          aria-label="생년월일"
          name="birthday"
          type="text"
          value={birthday}
          onChange={(event) => onBirthdayChange(event.target.value)}
          placeholder="YYYY.MM.DD"
          className={styles.input}
          autoComplete="bday"
        />
      </div>
    </FormSection>
  );
}

export default ProfileSection;
