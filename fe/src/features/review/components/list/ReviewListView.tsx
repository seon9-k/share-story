import { useParams } from 'react-router-dom';
import { getMeetup } from '../../../meetup';
import {
  PageContainer,
  PageHeading,
  EmptyState,
  ActionLink,
  FormSection,
  Notice,
} from '../../../../shared/ui';
import { reviewEntries } from '../../mocks/reviewEntries';
export default function ReviewListView() {
  const { meetupId } = useParams();
  const meetup = getMeetup(Number(meetupId));
  if (!meetup)
    return (
      <EmptyState
        title="모임을 찾을 수 없습니다."
        description="모임을 다시 선택해 주세요."
        action={<ActionLink to="/meetups">모임 목록</ActionLink>}
      />
    );
  const reviews = reviewEntries.filter((review) => review.meetupId === meetup.id);
  return (
    <PageContainer>
      <ActionLink to="/my-journal">나의 항해 일지</ActionLink>
      <PageHeading
        title="함께 읽은 시간, 항해 후기"
        description={`${meetup.title} · ${meetup.book}`}
        action={<ActionLink to={`/meetups/${meetup.id}/reviews/create`}>후기 작성</ActionLink>}
      />
      <Notice>미리보기 후기입니다. 실제 작성 내역은 아직 연결되지 않았습니다.</Notice>
      {reviews.length ? (
        reviews.map((review) => (
          <FormSection key={review.id} title={`${review.author} · ${review.rating}점`}>
            <p>{review.content}</p>
            <ActionLink to={`/meetups/${meetup.id}/reviews/${review.id}/edit`}>
              수정 미리보기
            </ActionLink>
          </FormSection>
        ))
      ) : (
        <EmptyState title="아직 후기가 없습니다." description="함께 읽은 경험을 남겨 주세요." />
      )}
    </PageContainer>
  );
}
