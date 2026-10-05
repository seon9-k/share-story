import { useRef } from 'react';
import { FormSection, TextInput, Button } from '../../../../shared/ui';
import type { MeetupSession } from '../../types/meetupForm';
import { toKoreanDay } from '../../lib/meetupMapper';

import styles from './FormSection.module.css';

interface SessionScheduleSectionProps {
  sessions: MeetupSession[];
  fixedCount?: number;

  onChange: (index: number, field: keyof Omit<MeetupSession, 'number'>, value: string) => void;

  onAdd: () => void;
  onRemove: (index: number) => void;

  // 항해 개설 화면에서는 종료 시간을 직접 선택하지 못하게 하고 자동 계산값만 노출한다.
  editableEndTime?: boolean;
}

function SessionScheduleSection({
  sessions,
  fixedCount,
  onChange,
  onAdd,
  onRemove,
  editableEndTime = true,
}: SessionScheduleSectionProps) {
  const isFixed = typeof fixedCount === 'number';
  const topicInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  return (
    <FormSection title="회차별 일정 / 주제">
      {isFixed && <p className={styles.sessionGuide}>회차는 {fixedCount}개로 고정되어 있습니다.</p>}

      <div className={styles.sessionList}>
        {sessions.map((session, index) => (
          <div key={session.number} className={styles.sessionCard}>
            <div className={styles.sessionInfoRow}>
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

              <span className={styles.sessionDayLabel}>{toKoreanDay(session.date) || '요일 미정'}</span>

              <TextInput
                type="time"
                required
                className={styles.sessionTimeInput}
                value={session.time}
                onChange={(event) => {
                  const value = event.target.value;
                  const inputElement = event.currentTarget;
                  onChange(index, 'time', value);
                  // 시(時)만 고른 중간 상태에서는 그대로 두고, 분까지 완성됐을 때만 선택창을 닫는다.
                  if (!/^\d{2}:\d{2}$/.test(value)) return;
                  // blur를 동기 호출하면 네이티브 시간 선택창의 커밋 처리를 끊어 한 번에 닫히지 않으므로 다음 틱으로 미룬다.
                  setTimeout(() => {
                    inputElement.blur();
                    if (!editableEndTime) topicInputRefs.current[index]?.focus();
                  }, 0);
                }}
                placeholder="시작 시간"
                aria-label={`${session.number}회차 시작 시간`}
              />

              {editableEndTime ? (
                <TextInput
                  type="time"
                  required
                  className={styles.sessionTimeInput}
                  value={session.endTime}
                  onChange={(event) => {
                    const value = event.target.value;
                    const inputElement = event.currentTarget;
                    onChange(index, 'endTime', value);
                    if (!/^\d{2}:\d{2}$/.test(value)) return;
                    setTimeout(() => inputElement.blur(), 0);
                  }}
                  placeholder="종료 시간"
                  aria-label={`${session.number}회차 종료 시간`}
                />
              ) : (
                <span className={styles.sessionEndTimeLabel}>
                  {session.endTime ? `~ ${session.endTime}` : '종료 시간 자동 설정'}
                </span>
              )}

              {!isFixed && sessions.length > 1 && (
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

            <div className={styles.sessionTopicRow}>
              <TextInput
                type="text"
                required
                ref={(element) => {
                  topicInputRefs.current[index] = element;
                }}
                className={styles.sessionTopicInput}
                value={session.topic}
                onChange={(event) => onChange(index, 'topic', event.target.value)}
                placeholder="주제"
                aria-label={`${session.number}회차 주제`}
              />
            </div>
          </div>
        ))}
      </div>

      {!isFixed && (
        <Button type="button" className={styles.addButton} onClick={onAdd}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          회차 추가
        </Button>
      )}
    </FormSection>
  );
}

export default SessionScheduleSection;
