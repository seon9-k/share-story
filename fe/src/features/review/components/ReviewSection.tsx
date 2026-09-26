import styles from './ReviewSection.module.css';
import { reviewMocks } from '../mocks/reviewMocks';

function ReviewSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>크루의 이야기</p>

          <h2 className={styles.title}>항해일지</h2>

          <p className={styles.description}>같은 책에서 시작해, 서로의 세계를 넓히는 항해.</p>
        </div>

        <div className={styles.grid}>
          {reviewMocks.map((review) => (
            <article key={review.name} className={styles.card}>
              <div className={styles.quote} aria-hidden="true">
                "
              </div>

              <p className={styles.reviewText}>{review.text}</p>

              <div className={styles.reviewer}>
                <img src={review.avatar} alt={review.name} className={styles.avatar} />

                <div>
                  <div className={styles.reviewerName}>{review.name}</div>

                  <div className={styles.reviewerRole}>{review.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ReviewSection;
