import { Link } from 'react-router-dom';

import type { CaptainJournalItem } from '../../types/journal';

import styles from './CaptainJournalSection.module.css';

interface CaptainJournalSectionProps {
  meetups: CaptainJournalItem[];
}

function CaptainJournalSection({ meetups }: CaptainJournalSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.description}>
        <p>내가 개설한 항해의 신청 및 진행 상태를 확인하세요.</p>

        <p className={styles.count}>총 {meetups.length}개의 생성한 항해</p>
      </div>

      {meetups.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">
            ⚓
          </div>

          <p className={styles.emptyText}>해당 상태의 항해가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {meetups.map((meetup) => {
            const participationRate =
              meetup.maxMembers > 0 ? (meetup.confirmedMembers / meetup.maxMembers) * 100 : 0;

            return (
              <article key={meetup.id} className={styles.card}>
                <div className={styles.heading}>
                  <h2 className={styles.title}>{meetup.title}</h2>

                  <span className={`${styles.status} ${styles[getStatusClassName(meetup.status)]}`}>
                    {meetup.status}
                  </span>
                </div>

                <p className={styles.members}>
                  신청 {meetup.appliedMembers} / {meetup.maxMembers}명 · 확정{' '}
                  {meetup.confirmedMembers}명
                </p>

                <p className={styles.period}>{meetup.period}</p>

                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${Math.min(participationRate, 100)}%`,
                    }}
                  />
                </div>

                <div className={styles.actions}>
                  <button type="button" className={`${styles.actionButton} ${styles.crewButton}`}>
                    크루 관리
                  </button>

                  <Link
                    to={`/meetups/${meetup.id}/logbooks/review`}
                    className={`${styles.actionButton} ${styles.logbookButton}`}
                  >
                    로그북 검토
                  </Link>

                  <Link
                    to={`/meetups/${meetup.id}/edit`}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    항해 수정
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getStatusClassName(status: CaptainJournalItem['status']) {
  switch (status) {
    case '모집 중':
      return 'recruiting';

    case '모집 마감':
      return 'closed';

    case '종료':
      return 'completed';
  }
}

export default CaptainJournalSection;
