import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth';
import { useMeetupDetail } from '../../../member';
import { useAllPages } from '../../../../shared/hooks/useResource';
import { PageContainer, PageHeading, ActionLink, Notice } from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { reviewPath, type ReviewItem } from '../../api/types';
import ReviewForm from '../ReviewForm';
import styles from '../../../../shared/ui/Voyage.module.css';
export default function ReviewCreateView() {
  const { meetupId = '' } = useParams();
  const { user } = useAuth();
  const detail = useMeetupDetail(meetupId);
  const reviews = useAllPages<ReviewItem>(reviewPath(meetupId));
  const ownReview = reviews.data?.some((review) => review.apply.user_id === user?.user_id);
  // 화면에서 불가능한 작성을 미리 안내. 참여 권한·종료 여부·중복 여부는
  // POST 요청 시 BE가 다시 검증하므로 이 조건이 서버 검증을 대신하지 않음
  const blocked =
    detail.data?.meetup.leader_id === user?.user_id
      ? '캡틴은 자신의 모임에 후기를 작성할 수 없습니다.'
      : detail.data?.meetup.status !== 'COMPLETED'
        ? '모임이 종료된 후 후기를 남길 수 있습니다.'
        : ownReview
          ? '이미 후기를 작성한 모임입니다.'
          : null;
  return (
    <div className={styles.page}>
      <PageContainer narrow>
        <ActionLink to={`/meetups/${meetupId}/reviews`}>← 항해 후기</ActionLink>
        <PageHeading title="함께한 항해는 어떠셨나요?" description={detail.data?.meetup.title} />
        <RequestState {...detail} retry={detail.reload} />
        <RequestState {...reviews} retry={reviews.reload} />
        {detail.data &&
          reviews.data &&
          (blocked ? (
            <Notice>{blocked}</Notice>
          ) : (
            <ReviewForm key={meetupId} meetupId={meetupId} />
          ))}
      </PageContainer>
    </div>
  );
}
