import { FormSection } from '../../../../shared/ui';
import type { PreferredCategory, ReadingAmount } from '../../types/signup';

import styles from './SignupFormSection.module.css';

interface ReadingPreferenceSectionProps {
  categories: PreferredCategory[];
  readingAmount: ReadingAmount | '';

  onCategoriesChange: (categories: PreferredCategory[]) => void;
  onReadingAmountChange: (readingAmount: ReadingAmount) => void;
}

const CATEGORIES: { value: PreferredCategory; label: string }[] = [
  { value: 'NOVEL', label: '소설' },
  { value: 'ECONOMY_BUSINESS', label: '경제·경영' },
  { value: 'SELF_DEVELOPMENT', label: '자기계발' },
  { value: 'IT', label: 'IT' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'TRAVEL_LIFESTYLE', label: '여행·라이프스타일' },
  { value: 'PARENT_CHILD', label: '부모 교육' },
  { value: 'HUMANITIES_PHILOSOPHY', label: '인문·철학' },
  { value: 'SOCIETY', label: '사회' },
  { value: 'SCIENCE', label: '과학' },
  { value: 'HISTORY', label: '역사' },
  { value: 'ETC', label: '그외' },
];

const READING_AMOUNTS: ReadingAmount[] = ['1~2권', '3~4권', '4~5권', '5~6권'];

function ReadingPreferenceSection({
  categories,
  readingAmount,
  onCategoriesChange,
  onReadingAmountChange,
}: ReadingPreferenceSectionProps) {
  const handleCategoryToggle = (category: PreferredCategory) => {
    const nextCategories = categories.includes(category)
      ? categories.filter((selectedCategory) => selectedCategory !== category)
      : [...categories, category];

    onCategoriesChange(nextCategories);
  };

  return (
    <FormSection title="선호 도서 / 한달 독서량">
      <p className={styles.fieldLabel}>선호 카테고리 (복수 선택 가능)</p>

      <div className={styles.preferenceGroup}>
        {CATEGORIES.map(({ value: category, label }) => {
          const isSelected = categories.includes(category);

          return (
            <button
              key={category}
              type="button"
              className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ''}`}
              onClick={() => handleCategoryToggle(category)}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className={styles.fieldLabel}>한달 독서량</p>

      <div className={styles.preferenceGroup}>
        {READING_AMOUNTS.map((amount) => {
          const isSelected = readingAmount === amount;

          return (
            <button
              key={amount}
              type="button"
              className={`${styles.optionButton} ${styles.readingButton} ${
                isSelected ? styles.optionButtonSelected : ''
              }`}
              onClick={() => onReadingAmountChange(amount)}
              aria-pressed={isSelected}
            >
              {amount}
            </button>
          );
        })}
      </div>

      <p className={styles.helpText}>필수 여부·복수 선택·구간 중복은 확인 필요</p>
    </FormSection>
  );
}

export default ReadingPreferenceSection;
