import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeetupDetail, updateMeetup, uploadBookImage } from '../../api/meetupApi';
import { toKoreanDay, addHoursToTime } from '../../lib/meetupMapper';
import { getCurrentUserId } from '../../lib/currentUser';
import type { MeetupDetail, MeetupDetailSession } from '../../types/meetupDetail';
import SessionScheduleSection from '../create/SessionScheduleSection';
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
  const [meetup, setMeetup] = useState<MeetupDetail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMeetupDetail(Number(meetupId))
      .then((detail) => {
        if (isMounted) setMeetup(detail);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [meetupId]);

  if (isLoading) return null;
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
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookImageUrl, setBookImageUrl] = useState(meetup.bookImageUrl ?? '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [sessions, setSessions] = useState(() =>
    meetup.sessions.map((session: MeetupDetailSession) => ({
      sessionId: session.sessionId,
      number: session.number,
      date: session.rawDate,
      time: session.time,
      endTime: session.endTime,
      topic: session.topic,
    })),
  );

  const handleBookImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setImageError('');
      const { url } = await uploadBookImage(file, getCurrentUserId());
      setBookImageUrl(url);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSessionChange = (
    index: number,
    field: 'date' | 'time' | 'endTime' | 'topic',
    value: string,
  ) => {
    setSessions((prev) =>
      prev.map((session, currentIndex) => {
        if (currentIndex !== index) return session;
        const updated = { ...session, [field]: value };
        // 시작 시간이 바뀌면 종료 시간을 2시간 뒤로 자동 갱신함.
        if (field === 'time') updated.endTime = addHoursToTime(value, 2);
        return updated;
      }),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userId = getCurrentUserId();
    if (!userId) {
      setMessage('모임 수정을 위해 로그인이 필요합니다.');
      return;
    }
    if (isUploadingImage) {
      setMessage('이미지 업로드가 끝난 뒤 저장해 주세요.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('intro') || '').trim();
    const priceInput = String(formData.get('price') || '').trim();
    const zoomUrlInput = String(formData.get('zoomUrl') || '').trim();
    const zoomPasswordInput = String(formData.get('zoomPassword') || '').trim();

    if (!title || !description) {
      setMessage('항해명과 소개를 모두 입력해 주세요.');
      return;
    }

    // 참여 금액은 선택 입력이며, 값을 입력했을 때만 유효성을 검사함.
    let price: number | undefined;
    if (priceInput) {
      price = Number(priceInput);
      if (!Number.isFinite(price) || price < 0) {
        setMessage('참여 금액을 입력할 경우 0원 이상 숫자로 입력해 주세요.');
        return;
      }
    }

    if (
      sessions.some(
        (session) => !session.date || !session.time || !session.endTime || !session.topic.trim(),
      )
    ) {
      setMessage('모든 회차의 날짜, 시작 시간, 종료 시간, 주제를 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');
      await updateMeetup(meetup.id, {
        userId,
        title,
        description,
        book_image_url: bookImageUrl.trim() || null,
        price,
        sessions: sessions.map((session) => ({
          session_id: session.sessionId,
          session_number: session.number,
          topic: session.topic,
          sch_date: session.date,
          sch_day: toKoreanDay(session.date),
          sch_time: session.time,
          sch_st_time: session.time,
          sch_ed_time: session.endTime || addHoursToTime(session.time, 2),
          zoom_url: zoomUrlInput || null,
          zoom_password: zoomPasswordInput || null,
        })),
      });
      navigate(`/meetups/${meetup.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '모임 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer narrow>
      <ActionLink to="/my-journal">나의 항해 일지</ActionLink>
      <PageHeading
        title="항해 정보를 수정합니다."
        description={
          <>
            책 제목 : {meetup.book}
            <br />
            캡틴 : {meetup.captain}
          </>
        }
      />
      <form onSubmit={handleSubmit}>
        <FormSection title="기본 정보">
          <Field label="도서 이미지">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleBookImageUpload}
              disabled={isUploadingImage || isSubmitting}
            />
            {isUploadingImage && <p>이미지 업로드 중...</p>}
            {imageError && <Notice>{imageError}</Notice>}
            {bookImageUrl && (
              <img
                src={bookImageUrl}
                alt="도서 표지 미리보기"
                style={{ display: 'block', marginTop: '0.5rem', maxHeight: '160px', objectFit: 'contain' }}
              />
            )}
          </Field>
          <Field label="항해명" required>
            <TextInput name="title" defaultValue={meetup.title} required />
          </Field>
          <Field label="소개" required>
            <TextArea name="intro" rows={5} defaultValue={meetup.intro} required />
          </Field>
          <Field label="참여 금액">
            <TextInput type="number" name="price" min={0} defaultValue={meetup.price ?? ''} />
          </Field>
          <Field label="Zoom URL">
            <TextInput
              name="zoomUrl"
              defaultValue={meetup.sessions[0]?.zoomUrl ?? ''}
              placeholder="Zoom 회의 링크 또는 ID"
            />
          </Field>
          <Field label="Zoom 비밀번호">
            <TextInput
              name="zoomPassword"
              defaultValue={meetup.sessions[0]?.zoomPassword ?? ''}
              placeholder="Zoom 비밀번호"
            />
          </Field>
        </FormSection>

        <SessionScheduleSection
          sessions={sessions}
          fixedCount={sessions.length}
          onChange={handleSessionChange}
          onAdd={() => {}}
          onRemove={() => {}}
        />

        <ActionLink to={`/meetups/${meetup.id}`}>취소</ActionLink>
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isUploadingImage ? '이미지 업로드 중...' : isSubmitting ? '저장 중...' : '수정 내용 저장'}
        </Button>
        {message && <Notice>{message}</Notice>}
      </form>
    </PageContainer>
  );
}
