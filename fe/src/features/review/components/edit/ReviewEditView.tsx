import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth';
import { useMeetupDetail } from '../../../member';
import { useAllPages } from '../../../../shared/hooks/useResource';
import { PageContainer, PageHeading, ActionLink, Notice } from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { reviewPath, type ReviewItem } from '../../api/types';
import ReviewForm from '../ReviewForm';
import styles from '../../../../shared/ui/Voyage.module.css';

// 본인 후기만 수정 가능. 대상은 목록에서 본인 후기를 찾아 사용하고 권한은 BE가 다시 검증
export default function ReviewEditView() {
  const { meetupId = '', reviewId } = useParams();
  const { user } = useAuth();
  const detail = useMeetupDetail(meetupId);
  const reviews = useAllPages<ReviewItem>(reviewPath(meetupId));
  const own = reviews.data?.find(
    (review) =>
      review.apply.user_id === user?.user_id && (!reviewId || review.review_id === reviewId),
  );
  return (
    <div className={styles.page}>
      <PageContainer narrow>
        <ActionLink to={`/meetups/${meetupId}/reviews`}>← 항해 후기</ActionLink>
        <PageHeading title="후기 수정" description={detail.data?.meetup.title} />
        <RequestState {...detail} retry={detail.reload} />
        <RequestState {...reviews} retry={reviews.reload} />
        {reviews.data &&
          (own ? (
            <ReviewForm
              key={own.review_id}
              meetupId={meetupId}
              initial={{ rating: own.rating, content: own.content }}
            />
          ) : (
            <Notice>수정할 수 있는 내 후기가 없습니다.</Notice>
          ))}
      </PageContainer>
    </div>
  );
}
