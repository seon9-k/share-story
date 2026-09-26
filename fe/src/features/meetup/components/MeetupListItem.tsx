import { Link } from 'react-router-dom';

import type { MeetupListItem as MeetupListItemType, MeetupStatus } from '../types/meetupList';

import styles from './MeetupListItem.module.css';

interface MeetupListItemProps {
  meetup: MeetupListItemType;
}

function MeetupListItem({ meetup }: MeetupListItemProps) {
  return (
    <Link to={`/meetups/${meetup.id}`} className={styles.item}>
      <div className={styles.imageWrapper}>
        <img src={meetup.image} alt={meetup.book} className={styles.image} />
      </div>

      <div className={styles.content}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{meetup.title}</h2>

          <span className={`${styles.status} ${styles[getStatusClassName(meetup.status)]}`}>
            {meetup.status}
          </span>
        </div>

        <p className={styles.members}>
          인원 {meetup.minMembers}~{meetup.maxMembers}명
        </p>

        <p className={styles.schedule}>
          {meetup.schedule} · {meetup.time} · 첫 항해 {meetup.firstDate}
        </p>
      </div>

      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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

export default MeetupListItem;
