import { GENDER_OPTIONS, READING_AMOUNT_OPTIONS } from '../../auth';
import type { MemberProfile } from '../../member';
import { FormSection } from '../../../shared/ui';
import { GENRES } from '../lib/profileLabels';
import styles from './ProfileInfo.module.css';

// 회원정보 조회: 입력창이 아닌 텍스트로 보여주고, 수정 버튼을 눌러야 ProfileEditForm의 입력창이 열림
export default function ProfileInfo({ profile, userId }: { profile?: MemberProfile; userId: string }) {
  const genderLabel = GENDER_OPTIONS.find((option) => option.value === profile?.gender)?.label;
  const readingLabel = READING_AMOUNT_OPTIONS.find(
    (option) => option.value === profile?.readingAmount,
  )?.label;
  const genres = (profile?.genres ?? []).map(
    (value) => GENRES.find((genre) => genre.value === value)?.label ?? value,
  );
  return (
    <FormSection title="기본 정보">
      <dl className={styles.list}>
        <Row label="아이디" value={profile?.user_id || userId} />
        <Row label="닉네임" value={profile?.name} />
        <Row label="이메일" value={profile?.email} />
        <Row label="성별" value={genderLabel} />
        <Row label="연령대" value={profile?.age_group} />
        <Row label="한달 독서량" value={readingLabel} />
        <div className={styles.row}>
          <dt className={styles.label}>선호 장르</dt>
          <dd className={styles.value}>
            {genres.length ? (
              <ul className={styles.tags}>
                {genres.map((genre) => (
                  <li className={styles.tag} key={genre}>
                    {genre}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.empty}>선택한 장르가 없습니다.</span>
            )}
          </dd>
        </div>
      </dl>
    </FormSection>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        {value || <span className={styles.empty}>제공된 정보가 없습니다.</span>}
      </dd>
    </div>
  );
}
