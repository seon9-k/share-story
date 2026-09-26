import type { MeetupDetail } from '../../types/meetupDetail';

import styles from './MeetupInfoSection.module.css';

interface MeetupInfoSectionProps {
  meetup: MeetupDetail;
}

function MeetupInfoSection({ meetup }: MeetupInfoSectionProps) {
  const participationRate = ((meetup.appliedMembers ?? 0) / meetup.maxMembers) * 100;

  return (
    <section className={styles.card}>
      <div className={styles.grid}>
        <div className={styles.infoItem}>
          <p className={styles.label}>장소 · 시간</p>

          <p className={styles.value}>
            {meetup.location} · {meetup.time}
          </p>
        </div>

        <div className={styles.infoItem}>
          <p className={styles.label}>신청 인원 / 정원</p>

          <p className={styles.value}>
            {meetup.appliedMembers === null
              ? '신청 인원 확인 예정'
              : `신청 ${meetup.appliedMembers}명`}{' '}
            / 정원 {meetup.maxMembers}명
          </p>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{
                width: `${Math.min(participationRate, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className={styles.infoItem}>
          <p className={styles.label}>모집 마감</p>

          <p className={styles.value}>{meetup.deadline}</p>
        </div>

        <div className={styles.infoItem}>
          <p className={styles.label}>참여 금액</p>

          <p className={styles.value}>
            {meetup.price === null
              ? '참여 금액 안내 예정'
              : `총 ${meetup.price.toLocaleString()}원 · ${meetup.payment}`}
          </p>
        </div>
      </div>
    </section>
  );
}

export default MeetupInfoSection;
