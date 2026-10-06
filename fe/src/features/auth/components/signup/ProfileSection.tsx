import { FormSection, Select } from '../../../../shared/ui';
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS, type Gender } from '../../types/signup';

import styles from './SignupFormSection.module.css';

interface ProfileSectionProps {
  gender: Gender | '';
  age_group: string;

  onGenderChange: (value: Gender) => void;
  onAgeGroupChange: (value: string) => void;
}

function ProfileSection({
  gender,
  age_group,
  onGenderChange,
  onAgeGroupChange,
}: ProfileSectionProps) {
  return (
    <FormSection title="성별 / 연령대">
      <div className={styles.fieldGroup}>
        <div className={styles.row}>
          {/* 화면엔 '남'/'여', 상태엔 'M'/'F' 저장 → BE ENUM과 일치 */}
          {GENDER_OPTIONS.map(({ value, label }) => {
            const isSelected = gender === value;

            return (
              <button
                key={value}
                type="button"
                className={`${styles.equalOptionButton} ${
                  isSelected ? styles.equalOptionButtonSelected : ''
                }`}
                onClick={() => onGenderChange(value)}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 생년월일(YYYY.MM.DD) 자유 입력 → 연령대 선택으로 변경 (DB age_group 값과 일치) */}
        <Select
          id="age_group"
          name="age_group"
          aria-label="연령대"
          value={age_group}
          onChange={(event) => onAgeGroupChange(event.target.value)}
          className={styles.select}
        >
          <option value="">연령대 선택</option>
          {AGE_GROUP_OPTIONS.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </Select>
      </div>
    </FormSection>
  );
}

export default ProfileSection;
