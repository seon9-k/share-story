import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { documentRequest } from '../../../../shared/api/client';
import { useAuth } from '../../../auth';
import { useMeetupDetail } from '../../../member';
import { useAllPages } from '../../../../shared/hooks/useResource';
import {
  PageContainer,
  PageHeading,
  EmptyState,
  ActionLink,
  Notice,
  Button,
} from '../../../../shared/ui';
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
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  // 본인 후기 삭제. 성공 후 목록을 다시 불러와 작성 버튼도 다시 노출
  const removeOwnReview = async () => {
    if (deleting || !window.confirm('작성한 후기를 삭제할까요?')) return;
    setDeleting(true);
    setMessage('');
    try {
      await documentRequest(`${reviewPath(meetupId)}/me`, { method: 'DELETE' });
      setMessage('후기를 삭제했습니다.');
      reviews.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '후기 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };
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
        {message && <Notice>{message}</Notice>}
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
                {/* 탈퇴 회원은 BE 조회에서 User가 null로 옴 */}
                {review.apply.User ? review.apply.User.name || review.apply.user_id : '탈퇴한 회원'}
                {review.apply.user_id === user?.user_id ? ' · 내 후기' : ''}
              </h2>
              <p className={styles.meta}>
                {new Date(review.reviewed_at).toLocaleDateString('ko-KR')}
              </p>
              <div className={styles.content}>{review.content}</div>
              {review.apply.user_id === user?.user_id && (
                <div className={styles.actions}>
                  <ActionLink to={`/meetups/${meetupId}/reviews/${review.review_id}/edit`}>
                    후기 수정
                  </ActionLink>
                  <Button variant="secondary" onClick={removeOwnReview} disabled={deleting}>
                    {deleting ? '삭제 중…' : '후기 삭제'}
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
