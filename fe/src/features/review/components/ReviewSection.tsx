import { useEffect, useMemo, useState, type CSSProperties, type TransitionEvent } from 'react';

import styles from './ReviewSection.module.css';
import { fetchHighlightReviews, type HighlightReview } from '../api/publicReviews';
import { useReviewCarousel } from '../hooks/useReviewCarousel';
import { toDisplayReviews } from '../lib/reviewDisplay';
import type { Review } from '../types/review';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';

interface ReviewCarouselProps {
  reviews: Review[];
  visible: number;
  rotate: boolean;
}

function ReviewCarousel({ reviews, visible, rotate }: ReviewCarouselProps) {
  // 보이는 카드보다 많을 때만 순환함. 적으면 가운데 정렬로 고정해서 보여줌
  const rotating = rotate && reviews.length > visible;
  const { index, animate, settle, pause, resume } = useReviewCarousel(reviews.length, rotating);

  // 순환 시에는 끝에서 처음으로 이어지도록 앞쪽 카드를 visible개 복제해 뒤에 붙임
  // 모션 축소 설정에서 카드가 많으면 자동 이동 없이 앞쪽 visible개만 보여줌
  const slides = rotating
    ? [...reviews, ...reviews.slice(0, visible)]
    : reviews.slice(0, visible);

  const trackStyle = { '--visible': visible, '--index': rotating ? index : 0 } as CSSProperties;

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) settle();
  };

  return (
    <div
      className={styles.viewport}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div
        className={`${styles.track} ${rotating ? '' : styles.static} ${
          rotating && animate ? styles.animate : ''
        }`}
        style={trackStyle}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((review, slideIndex) => (
          // 복제된 카드는 스크린리더가 중복 낭독하지 않도록 숨김
          <div
            key={`${slideIndex}-${review.name}`}
            className={styles.slide}
            aria-hidden={slideIndex >= reviews.length ? true : undefined}
          >
            <article className={styles.card}>
              <div className={styles.quote} aria-hidden="true">
                "
              </div>

              <p className={styles.reviewText}>{review.text}</p>

              <div className={styles.reviewer}>
                {review.avatar ? (
                  <img src={review.avatar} alt="" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden="true">
                    {Array.from(review.name)[0]}
                  </div>
                )}

                <div>
                  <div className={styles.reviewerName}>{review.name}</div>

                  <div className={styles.reviewerRole}>{review.role}</div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewSection() {
  // 실제 리뷰가 없거나 조회에 실패하면 빈 배열로 두어 목업을 보여줌
  const [real, setReal] = useState<HighlightReview[]>([]);
  const visible = useMediaQuery('(min-width: 768px)') ? 3 : 1;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const controller = new AbortController();
    fetchHighlightReviews(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setReal(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setReal([]);
      });
    return () => controller.abort();
  }, []);

  const reviews = useMemo(() => toDisplayReviews(real), [real]);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>크루의 이야기</p>

          <h2 className={styles.title}>항해일지</h2>

          <p className={styles.description}>같은 책에서 시작해, 서로의 세계를 넓히는 항해.</p>
        </div>

        {/* 목록이나 표시 개수가 바뀌면 캐러셀 상태를 처음부터 다시 시작함 */}
        <ReviewCarousel
          key={`${reviews.length}-${visible}`}
          reviews={reviews}
          visible={visible}
          rotate={!reduceMotion}
        />
      </div>
    </section>
  );
}

export default ReviewSection;
