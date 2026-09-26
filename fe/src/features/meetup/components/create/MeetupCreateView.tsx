import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { MeetupForm, MeetupSession } from '../../types/meetupForm';
import { validateMeetup } from '../../lib/meetupValidation';
import { Button, Notice } from '../../../../shared/ui';

import MeetupInfoSection from './MeetupInfoSection';
import PaymentSection from './PaymentSection';
import RecruitConditionSection from './RecruitConditionSection';
import SessionScheduleSection from './SessionScheduleSection';

import styles from './MeetupCreateView.module.css';

const INITIAL_FORM: MeetupForm = {
  bookTitle: '',
  meetupTitle: '',
  intro: '',
  location: '',
  minMembers: '4',
  maxMembers: '8',
  deadline: '',
  price: '40000',
  payment: '일시납',
};

const INITIAL_SESSIONS: MeetupSession[] = [
  {
    number: 1,
    date: '',
    time: '',
    topic: '',
  },
];

function MeetupCreateView() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

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
      prev.map((session, currentIndex) =>
        currentIndex === index
          ? {
              ...session,
              [field]: value,
            }
          : session,
      ),
    );
  };

  const handleAddSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        number: prev.length + 1,
        date: '',
        time: '',
        topic: '',
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
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

  const handleSubmit = () => {
    setMessage(
      validateMeetup(form, sessions) ??
        '모임 개설은 아직 준비 중입니다. 모임이 생성되지 않았습니다.',
    );
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
        />

        <PaymentSection form={form} onChange={handleFormChange} />

        {message && <Notice>{message}</Notice>}

        <div className={styles.actions}>
          <Button variant="secondary" className={styles.cancelButton} onClick={handleCancel}>
            취소
          </Button>

          <Button type="submit" className={styles.submitButton}>
            개설하기
          </Button>
        </div>
      </form>
    </div>
  );
}

export default MeetupCreateView;
