import { Link } from 'react-router-dom';

import styles from './MeetupCard.module.css';

import type { Meetup, MeetupStatus } from '../types/meetup';

interface MeetupCardProps {
  meetup: Meetup;
}

function MeetupCard({ meetup }: MeetupCardProps) {
  const participationRate = ((meetup.members ?? 0) / meetup.maxMembers) * 100;

  const isCompleted = meetup.status === '입항 완료';

  return (
    <Link to={`/meetups/${meetup.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={meetup.image} alt={meetup.title} className={styles.image} />

        <div className={styles.imageOverlay} aria-hidden="true" />

        <span className={`${styles.status} ${styles[getStatusClassName(meetup.status)]}`}>
          {meetup.status}
        </span>

        <span className={styles.genre}>{meetup.genre}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{meetup.title}</h3>

        <p className={styles.book}>📚 {meetup.book}</p>

        <div className={styles.meta}>
          <span>⚓ 캡틴 {meetup.captain}</span>

          <span>
            👥{' '}
            {meetup.members === null
              ? `정원 ${meetup.maxMembers}명`
              : `${meetup.members}/${meetup.maxMembers}명`}
          </span>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${participationRate}%` }} />
        </div>

        <div className={styles.footer}>
          <div className={styles.schedule}>
            <div>🕐 {meetup.nextMeeting}</div>
            <div>📍 {meetup.location}</div>
          </div>

          <span className={`${styles.detailBadge} ${isCompleted ? styles.completedBadge : ''}`}>
            {isCompleted ? '항해 종료' : '상세 보기'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function getStatusClassName(status: MeetupStatus) {
  switch (status) {
    case '항해 중':
      return 'sailing';

    case '승선 대기':
      return 'waiting';

    case '입항 완료':
      return 'completed';
  }
}

export default MeetupCard;
