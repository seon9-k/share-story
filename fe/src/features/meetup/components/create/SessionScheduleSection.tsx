import { useEffect, useRef } from 'react';
import { FormSection, TextInput, Button } from '../../../../shared/ui';
import type { MeetupSession } from '../../types/meetupForm';
import { toKoreanDay } from '../../lib/meetupMapper';

import styles from './FormSection.module.css';

// 시·분(오전/오후 세그먼트가 없는 환경이 대부분)을 클릭하는 동안에는 닫히지 않도록 마지막 클릭 후 이만큼 기다린다.
const TIME_PICKER_CLOSE_DELAY_MS = 600;
// 시/분만 고르고 닫히지 않도록, 이 횟수만큼 선택해야만 닫는다(오전/오후 세그먼트가 없으면 시·분 2회로 충분).
const MIN_SELECTIONS_BEFORE_CLOSE = 2;

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
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  const topicInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const startTimeCloseTimers = useRef<Array<ReturnType<typeof setTimeout> | undefined>>([]);
  const endTimeCloseTimers = useRef<Array<ReturnType<typeof setTimeout> | undefined>>([]);
  const startTimeSelectionCounts = useRef<number[]>([]);
  const endTimeSelectionCounts = useRef<number[]>([]);

  useEffect(
    () => () => {
      startTimeCloseTimers.current.forEach((timer) => timer && clearTimeout(timer));
      endTimeCloseTimers.current.forEach((timer) => timer && clearTimeout(timer));
    },
    [],
  );

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
                min={minDate}
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
                onFocus={() => {
                  startTimeSelectionCounts.current[index] = 0;
                }}
                onKeyDown={(event) => {
                  // Enter로 직접 확정/닫기를 할 수 있게 허용한다.
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  if (startTimeCloseTimers.current[index]) clearTimeout(startTimeCloseTimers.current[index]);
                  event.currentTarget.blur();
                  startTimeSelectionCounts.current[index] = 0;
                  if (!editableEndTime) topicInputRefs.current[index]?.focus();
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  const inputElement = event.currentTarget;
                  onChange(index, 'time', value);
                  // 시(時)만 고른 중간 상태에서는 그대로 두고, 분까지 완성됐을 때만 선택창을 닫는다.
                  if (!/^\d{2}:\d{2}$/.test(value)) return;
                  const nextCount = (startTimeSelectionCounts.current[index] ?? 0) + 1;
                  startTimeSelectionCounts.current[index] = nextCount;
                  // 시·분·오전/오후을 연이어 클릭하는 동안에는 닫지 않도록, 최소 선택 횟수를 채운 뒤만 타이머를 걸어 닫는다.
                  if (nextCount < MIN_SELECTIONS_BEFORE_CLOSE) return;
                  if (startTimeCloseTimers.current[index]) clearTimeout(startTimeCloseTimers.current[index]);
                  startTimeCloseTimers.current[index] = setTimeout(() => {
                    inputElement.blur();
                    startTimeSelectionCounts.current[index] = 0;
                    if (!editableEndTime) topicInputRefs.current[index]?.focus();
                  }, TIME_PICKER_CLOSE_DELAY_MS);
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
                  onFocus={() => {
                    endTimeSelectionCounts.current[index] = 0;
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    if (endTimeCloseTimers.current[index]) clearTimeout(endTimeCloseTimers.current[index]);
                    event.currentTarget.blur();
                    endTimeSelectionCounts.current[index] = 0;
                  }}
                  onChange={(event) => {
                    const value = event.target.value;
                    const inputElement = event.currentTarget;
                    onChange(index, 'endTime', value);
                    if (!/^\d{2}:\d{2}$/.test(value)) return;
                    const nextCount = (endTimeSelectionCounts.current[index] ?? 0) + 1;
                    endTimeSelectionCounts.current[index] = nextCount;
                    if (nextCount < MIN_SELECTIONS_BEFORE_CLOSE) return;
                    if (endTimeCloseTimers.current[index]) clearTimeout(endTimeCloseTimers.current[index]);
                    endTimeCloseTimers.current[index] = setTimeout(() => {
                      inputElement.blur();
                      endTimeSelectionCounts.current[index] = 0;
                    }, TIME_PICKER_CLOSE_DELAY_MS);
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
