import { useParams } from 'react-router-dom';
import { getMeetup } from '../../../meetup';
import { PageContainer, PageHeading, EmptyState, ActionLink } from '../../../../shared/ui';
import ReviewForm from '../ReviewForm';
export default function ReviewCreateView() {
  const { meetupId } = useParams();
  const meetup = getMeetup(Number(meetupId));
  if (!meetup)
    return (
      <EmptyState
        title="모임을 찾을 수 없습니다."
        description="모임을 다시 선택해 주세요."
        action={<ActionLink to="/my-journal">나의 항해 일지</ActionLink>}
      />
    );
  return (
    <PageContainer narrow>
      <PageHeading
        eyebrow="CREW JOURNAL / NEW"
        title="이번 항해는 어떠셨나요?"
        description={`${meetup.title} · ${meetup.book}`}
      />
      <ReviewForm key={meetup.id} meetupId={meetup.id} />
    </PageContainer>
  );
}
