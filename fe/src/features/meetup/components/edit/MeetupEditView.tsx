import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMeetupDetail } from '../../mocks/meetupCatalog';
import type { MeetupDetail } from '../../types/meetupDetail';
import {
  Field,
  PageHeading,
  TextArea,
  TextInput,
  Button,
  ActionLink,
  PageContainer,
  FormSection,
  EmptyState,
  Notice,
} from '../../../../shared/ui';
export default function MeetupEditView() {
  const { meetupId } = useParams();
  const meetup = getMeetupDetail(Number(meetupId));
  if (!meetup)
    return (
      <EmptyState
        title="모임을 찾을 수 없습니다."
        description="모임 목록에서 다시 선택해 주세요."
        action={<ActionLink to="/meetups">모임 목록</ActionLink>}
      />
    );
  return <MeetupEditForm key={meetup.id} meetup={meetup} />;
}
function MeetupEditForm({ meetup }: { meetup: MeetupDetail }) {
  const [message, setMessage] = useState('');
  return (
    <PageContainer narrow>
      <ActionLink to="/my-journal">나의 항해 일지</ActionLink>
      <PageHeading title="항해 정보를 수정합니다." description={meetup.book} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setMessage('모임 수정은 아직 준비 중입니다. 변경 내용이 저장되지 않았습니다.');
        }}
      >
        <FormSection title="기본 정보">
          <Field label="항해명" required>
            <TextInput name="title" defaultValue={meetup.title} required />
          </Field>
          <Field label="소개" required>
            <TextArea name="intro" rows={5} defaultValue={meetup.intro} required />
          </Field>
          <Field label="참여 금액" required>
            <TextInput
              type="number"
              name="price"
              min={0}
              defaultValue={meetup.price ?? ''}
              required
            />
          </Field>
          <ActionLink to={`/meetups/${meetup.id}`}>취소</ActionLink>
          <Button type="submit">수정 내용 저장</Button>
        </FormSection>
        {message && <Notice>{message}</Notice>}
      </form>
    </PageContainer>
  );
}
