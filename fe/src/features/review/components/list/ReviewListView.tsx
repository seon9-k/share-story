import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth';
import { useMeetupDetail } from '../../../member';
import { useAllPages } from '../../../../shared/hooks/useResource';
import { PageContainer, PageHeading, EmptyState, ActionLink, Notice } from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { reviewPath, type ReviewItem } from '../../api/types';
import styles from '../../../../shared/ui/Voyage.module.css';
export default function ReviewListView() {
  const { meetupId = '' } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const reviews = useAllPages<ReviewItem>(reviewPath(meetupId));
  const detail = useMeetupDetail(meetupId);
  const ownReview = reviews.data?.find((review) => review.apply.user_id === user?.user_id);
  const canCreate =
    reviews.data &&
    detail.data?.meetup.status === 'COMPLETED' &&
    detail.data.meetup.leader_id !== user?.user_id &&
    !ownReview;
  return (
    <div className={styles.page}>
      <PageContainer>
        <ActionLink to="/mypage/journal">← 나의 항해 일지</ActionLink>
        <PageHeading
          title="함께 읽은 시간, 항해 후기"
          description={detail.data?.meetup.title}
          action={
            canCreate ? (
              <ActionLink to={`/meetups/${meetupId}/reviews/create`}>후기 작성</ActionLink>
            ) : undefined
          }
        />
        {location.state?.message && <Notice>{String(location.state.message)}</Notice>}
        <RequestState {...detail} retry={detail.reload} />
        <RequestState {...reviews} retry={reviews.reload} />
        {ownReview && <Notice>이 모임에 후기를 남겼습니다.</Notice>}
        {reviews.data?.length === 0 && (
          <EmptyState
            title="아직 후기가 없습니다."
            description="모임이 종료되면 참여한 크루가 후기를 남길 수 있습니다."
          />
        )}
        <div className={styles.grid}>
          {reviews.data?.map((review) => (
            <article className={styles.card} key={review.review_id}>
              <span className={styles.badge}>{review.rating} / 5점</span>
              <h2>
                {review.apply.User?.name || review.apply.user_id}
                {review.apply.user_id === user?.user_id ? ' · 내 후기' : ''}
              </h2>
              <p className={styles.meta}>
                {new Date(review.reviewed_at).toLocaleDateString('ko-KR')}
              </p>
              <div className={styles.content}>{review.content}</div>
            </article>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
