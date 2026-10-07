import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { MeetupForm, MeetupSession } from '../../types/meetupForm';
import { createMeetup } from '../../api/meetupApi';
import { toCreateMeetupRequest, addHoursToTime } from '../../lib/meetupMapper';
import { validateMeetup, validateLeaderUserIdentity } from '../../lib/meetupValidation';
import { getCurrentUserId } from '../../lib/currentUser';
import { Button, Notice } from '../../../../shared/ui';

import MeetupInfoSection from './MeetupInfoSection';
import PaymentSection from './PaymentSection';
import RecruitConditionSection from './RecruitConditionSection';
import SessionScheduleSection from './SessionScheduleSection';

import styles from './MeetupCreateView.module.css';

const REQUIRED_SESSION_COUNT = 4;


const INITIAL_FORM: MeetupForm = {
  bookTitle: '',
  bookImageUrl: '',
  meetupTitle: '',
  intro: '',
  zoomUrl: '',
  zoomPassword: '',
  minMembers: '4',
  maxMembers: '8',
  deadline: '',
  price: '40000',
  payment: '일시납',
};

const INITIAL_SESSIONS: MeetupSession[] = Array.from({ length: REQUIRED_SESSION_COUNT }, (_, index) => ({
  number: index + 1,
  date: '',
  time: '',
  endTime: '',
  topic: '',
}));

function MeetupCreateView() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<MeetupForm>(INITIAL_FORM);
  const [sessions, setSessions] = useState<MeetupSession[]>(INITIAL_SESSIONS);

  const handleFormChange = (field: keyof MeetupForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSessionChange = (
    index: number,
    field: keyof Omit<MeetupSession, 'number'>,
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

  const handleAddSession = () => {
    if (sessions.length >= REQUIRED_SESSION_COUNT) return;
    setSessions((prev) => [
      ...prev,
      {
        number: prev.length + 1,
        date: '',
        time: '',
        endTime: '',
        topic: '',
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    if (sessions.length <= REQUIRED_SESSION_COUNT) return;
    setSessions((prev) =>
      prev
        .filter((_, currentIndex) => currentIndex !== index)
        .map((session, currentIndex) => ({
          ...session,
          number: currentIndex + 1,
        })),
    );
  };

  const handleCancel = () => {
    navigate('/meetups');
  };

  const handleSubmit = async () => {
    const validationMessage = validateMeetup(form, sessions);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const leaderId = getCurrentUserId();
    const userId = leaderId;

    const identityMessage = validateLeaderUserIdentity(leaderId, userId);
    if (identityMessage) {
      setMessage(identityMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');
      const payload = toCreateMeetupRequest(form, sessions, leaderId, userId);
      if (import.meta.env.DEV) {
        console.log('[MeetupCreate] POST /meetup payload', payload);
      }
      await createMeetup(payload);
      navigate('/meetups');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '모임 개설 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <button type="button" className={styles.backButton} onClick={handleCancel}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            돌아가기
          </button>

          <p className={styles.eyebrow}>항해 개설</p>

          <h1 className={styles.title}>새로운 항해를 시작하세요</h1>

          <p className={styles.description}>함께할 크루와 항해 정보를 입력해 주세요.</p>
        </div>
      </header>

      <form
        className={styles.formContainer}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <MeetupInfoSection form={form} onChange={handleFormChange} />

        <RecruitConditionSection form={form} onChange={handleFormChange} />

        <SessionScheduleSection
          sessions={sessions}
          onChange={handleSessionChange}
          onAdd={handleAddSession}
          onRemove={handleRemoveSession}
          fixedCount={REQUIRED_SESSION_COUNT}
          editableEndTime={false}
        />

        <PaymentSection form={form} onChange={handleFormChange} />

        {message && <Notice>{message}</Notice>}

        <div className={styles.actions}>
          <Button variant="secondary" className={styles.cancelButton} onClick={handleCancel}>
            취소
          </Button>

          <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? '개설 중...' : '개설하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default MeetupCreateView;
