import { Link } from 'react-router-dom';

import MeetupCard from './MeetupCard';
import { meetupMocks } from '../mocks/meetupMocks';

import styles from './MeetupSection.module.css';

function MeetupSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>모임 탐색</p>
            <h2 className={styles.title}>지금 항해 중인 모임</h2>
          </div>

          <Link to="/meetups" className={styles.viewAllLink}>
            전체 보기 →
          </Link>
        </div>

        <div className={styles.grid}>
          {meetupMocks.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default MeetupSection;
