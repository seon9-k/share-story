import type { MeetupDetail } from '../../types/meetupDetail';

import styles from './MeetupHeroSection.module.css';

interface MeetupHeroSectionProps {
  meetup: MeetupDetail;
}

function MeetupHeroSection({ meetup }: MeetupHeroSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={meetup.image} alt={meetup.book} className={styles.image} />
      </div>

      <div className={styles.content}>
        <span className={styles.status}>{meetup.status}</span>

        <h1 className={styles.title}>{meetup.title}</h1>

        <p className={styles.book}>도서 · {meetup.book}</p>

        <div className={styles.captain}>
          <div className={styles.captainIcon} aria-hidden="true">
            ⚓
          </div>

          <span className={styles.captainName}>캡틴 {meetup.captain}</span>
        </div>

        <p className={styles.intro}>{meetup.intro}</p>
      </div>
    </section>
  );
}

export default MeetupHeroSection;
