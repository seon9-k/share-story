import { useState } from 'react';
import {
  authApi,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  MAX_GENRES,
  READING_AMOUNT_OPTIONS,
  type Gender,
  type PreferredGenre,
  type ReadingAmount,
} from '../../auth';
import type { MemberProfile } from '../../member';
import styles from './ProfileEditForm.module.css';
import { Button, Field, FormSection, Notice, Select, TextInput } from '../../../shared/ui';

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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 이름·이메일·독서 취향 수정. 아이디는 변경 불가
export default function ProfileEditForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: MemberProfile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [gender, setGender] = useState<Gender | ''>(profile.gender || '');
  const [ageGroup, setAgeGroup] = useState(profile.age_group || '');
  const [readingAmount, setReadingAmount] = useState<ReadingAmount | ''>(
    profile.readingAmount || '',
  );
  const [genres, setGenres] = useState<PreferredGenre[]>(profile.genres as PreferredGenre[]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (genre: PreferredGenre) =>
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((value) => value !== genre)
        : current.length < MAX_GENRES
          ? [...current, genre]
          : current,
    );

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting) return;
        if (!name.trim() || name.trim().length > 50)
          return setMessage('닉네임은 1~50자로 입력해 주세요.');
        if (!EMAIL_RE.test(email.trim())) return setMessage('이메일 형식을 확인해 주세요.');
        if (!gender || !ageGroup || !readingAmount)
          return setMessage('성별, 연령대, 독서량을 선택해 주세요.');
        setSubmitting(true);
        setMessage('');
        try {
          await authApi.updateMyInfo({
            name: name.trim(),
            email: email.trim(),
            gender,
            age_group: ageGroup,
            readingAmount,
            genres,
          });
          onSaved();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : '회원정보 수정에 실패했습니다.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <FormSection title="회원정보 수정">
        <Field label="아이디">
          <TextInput value={profile.user_id} readOnly />
        </Field>
        <Field label="닉네임" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="이메일" required>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="성별" required>
          <Select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | '')}
            disabled={submitting}
          >
            <option value="">선택</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="연령대" required>
          <Select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            disabled={submitting}
          >
            <option value="">선택</option>
            {AGE_GROUP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="한달 독서량" required>
          <Select
            value={readingAmount}
            onChange={(e) => setReadingAmount(e.target.value as ReadingAmount | '')}
            disabled={submitting}
          >
            <option value="">선택</option>
            {READING_AMOUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <p className={styles.label}>
            선호 장르
            <span className={styles.count}>
              {genres.length}/{MAX_GENRES}
            </span>
          </p>
          <div className={styles.chips}>
            {GENRES.map((genre) => {
              const selected = genres.includes(genre.value);
              return (
                <button
                  key={genre.value}
                  type="button"
                  className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                  aria-pressed={selected}
                  disabled={submitting || (!selected && genres.length >= MAX_GENRES)}
                  onClick={() => toggleGenre(genre.value)}
                >
                  {genre.label}
                </button>
              );
            })}
          </div>
        </div>
        {message && <Notice>{message}</Notice>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
