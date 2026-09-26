import { FormSection, TextInput, Button } from '../../../../shared/ui';
import type { MeetupSession } from '../../types/meetupForm';

import styles from './FormSection.module.css';

interface SessionScheduleSectionProps {
  sessions: MeetupSession[];

  onChange: (index: number, field: keyof Omit<MeetupSession, 'number'>, value: string) => void;

  onAdd: () => void;
  onRemove: (index: number) => void;
}

function SessionScheduleSection({
  sessions,
  onChange,
  onAdd,
  onRemove,
}: SessionScheduleSectionProps) {
  return (
    <FormSection number={3} title="회차별 일정 / 주제">
      <div className={styles.sessionList}>
        {sessions.map((session, index) => (
          <div key={session.number} className={styles.sessionRow}>
            <div className={styles.sessionNumber}>{session.number}</div>

            <TextInput
              type="date"
              required
              className={styles.sessionDateInput}
              value={session.date}
              onChange={(event) => onChange(index, 'date', event.target.value)}
              placeholder="날짜"
              aria-label={`${session.number}회차 날짜`}
            />

            <TextInput
              type="time"
              required
              className={styles.sessionTimeInput}
              value={session.time}
              onChange={(event) => onChange(index, 'time', event.target.value)}
              placeholder="시간"
              aria-label={`${session.number}회차 시간`}
            />

            <TextInput
              type="text"
              required
              className={styles.sessionTopicInput}
              value={session.topic}
              onChange={(event) => onChange(index, 'topic', event.target.value)}
              placeholder="주제"
              aria-label={`${session.number}회차 주제`}
            />

            {sessions.length > 1 && (
              <Button
                type="button"
                className={styles.removeButton}
                onClick={() => onRemove(index)}
                aria-label={`${session.number}회차 삭제`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button type="button" className={styles.addButton} onClick={onAdd}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        회차 추가
      </Button>
    </FormSection>
  );
}

export default SessionScheduleSection;
