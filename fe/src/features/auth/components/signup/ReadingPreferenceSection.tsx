import { FormSection } from '../../../../shared/ui';
import {
  MAX_GENRES,
  READING_AMOUNT_OPTIONS,
  type PreferredGenre,
  type ReadingAmount,
} from '../../types/signup';

import styles from './SignupFormSection.module.css';

interface ReadingPreferenceSectionProps {
  genres: PreferredGenre[];
  readingAmount: ReadingAmount | '';

  onGenreChange: (genres: PreferredGenre[]) => void;
  onReadingAmountChange: (readingAmount: ReadingAmount) => void;
}

const GENRES: { value: PreferredGenre; label: string }[] = [
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

function ReadingPreferenceSection({
  genres,
  readingAmount,
  onGenreChange,
  onReadingAmountChange,
}: ReadingPreferenceSectionProps) {
  const isGenreFull = genres.length >= MAX_GENRES;

  const handleGenreToggle = (genre: PreferredGenre) => {
    if (genres.includes(genre)) {
      onGenreChange(genres.filter((selectedGenre) => selectedGenre !== genre));
      return;
    }
    // BE는 2개까지만 저장. 기존엔 3번째부터 조용히 버려졌음 → 선택 자체를 막음
    if (isGenreFull) return;
    onGenreChange([...genres, genre]);
  };

  return (
    <FormSection title="선호 도서 / 한달 독서량">
      <p className={styles.fieldLabel}>선호 카테고리 (최대 {MAX_GENRES}개)</p>

      <div className={styles.preferenceGroup}>
        {GENRES.map(({ value: genre, label }) => {
          const isSelected = genres.includes(genre);

          return (
            <button
              key={genre}
              type="button"
              className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ''}`}
              onClick={() => handleGenreToggle(genre)}
              aria-pressed={isSelected}
              disabled={!isSelected && isGenreFull}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className={styles.fieldLabel}>한달 독서량</p>

      <div className={styles.preferenceGroup}>
        {/* 값은 BOOKS_1_2 등 BE 코드, 화면엔 label 표시 */}
        {READING_AMOUNT_OPTIONS.map(({ value, label }) => {
          const isSelected = readingAmount === value;

          return (
            <button
              key={value}
              type="button"
              className={`${styles.optionButton} ${styles.readingButton} ${
                isSelected ? styles.optionButtonSelected : ''
              }`}
              onClick={() => onReadingAmountChange(value)}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 기존 임시 문구(필수 여부·구간 중복 확인 필요) 정리: 장르 선택, 독서량 필수 */}
      <p className={styles.helpText}>선호 카테고리는 선택 사항, 한달 독서량은 필수입니다.</p>
    </FormSection>
  );
}

export default ReadingPreferenceSection;
