import type { RelatedMeetup } from '../../types/meetupDetail';

import styles from './RelatedMeetupsSection.module.css';

interface RelatedMeetupsSectionProps {
  meetups: RelatedMeetup[];
}

function RelatedMeetupsSection({ meetups }: RelatedMeetupsSectionProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>이런 항해도 함께 참여해 보세요</h2>

      <div className={styles.grid}>
        {meetups.map((meetup) => (
          <article key={`${meetup.title}-${meetup.book}`} className={styles.meetup}>
            <div className={styles.imageWrapper}>
              <img src={meetup.image} alt={meetup.book} className={styles.image} />
            </div>

            <p className={styles.meetupTitle}>{meetup.title}</p>

            <p className={styles.book}>{meetup.book}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RelatedMeetupsSection;
