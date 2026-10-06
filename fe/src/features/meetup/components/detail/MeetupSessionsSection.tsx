import type { MeetupDetailSession } from '../../types/meetupDetail';
import { toKoreanDay } from '../../lib/meetupMapper';

import styles from './MeetupSessionsSection.module.css';

interface MeetupSessionsSectionProps {
  sessions: MeetupDetailSession[];
  price: number | null;
}

function MeetupSessionsSection({ sessions, price }: MeetupSessionsSectionProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>회차별 일정 / 주제</h2>

      <div className={styles.sessionList}>
        {sessions.map((session) => (
          <div key={session.number} className={styles.sessionRow}>
            <div className={styles.sessionNumber}>{session.number}</div>

            <span className={styles.date}>{session.date}</span>

            <span className={styles.day}>{toKoreanDay(session.rawDate) || '요일 미정'}</span>

            <span className={styles.time}>
              {session.time ? `${session.time}${session.endTime ? ` - ${session.endTime}` : ''}` : '시간 미정'}
            </span>

            <span className={styles.topic}>{session.topic}</span>
          </div>
        ))}
      </div>

      <p className={styles.summary}>
        {sessions.length ? `총 ${sessions.length}회` : '회차 안내 예정'} ·{' '}
        {price === null ? '금액 안내 예정' : `${price.toLocaleString()}원`}
      </p>
    </section>
  );
}

export default MeetupSessionsSection;
