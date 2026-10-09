import { useAllPages } from '../../../../shared/hooks/useResource';
import { reviewPath, type ReviewItem } from '../../../review/api/types';

import styles from './MeetupReviewsSection.module.css';

interface MeetupReviewsSectionProps {
  meetupId: number;
}

// 종료된 모임에서만 렌더링함. 후기가 없거나 조회에 실패하면 섹션 자체를 숨김
function MeetupReviewsSection({ meetupId }: MeetupReviewsSectionProps) {
  const reviews = useAllPages<ReviewItem>(reviewPath(String(meetupId)));

  if (!reviews.data || reviews.data.length === 0) return null;

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>항해 후기</h2>

      <ul className={styles.list}>
        {reviews.data.map((review) => (
          <li key={review.review_id} className={styles.item}>
            <div className={styles.header}>
              {/* 탈퇴 회원은 User가 null로 내려옴 */}
              <span className={styles.name}>
                {review.apply.User ? review.apply.User.name || review.apply.user_id : '탈퇴한 회원'}
              </span>

              <span className={styles.rating}>{review.rating} / 5점</span>
            </div>

            <p className={styles.text}>{review.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MeetupReviewsSection;
