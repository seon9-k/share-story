import { Link } from 'react-router-dom';

import type { CrewJournalItem } from '../../types/journal';

import styles from './CrewJournalSection.module.css';

interface CrewJournalSectionProps {
  meetups: CrewJournalItem[];

  logbookText: Record<string, string>;

  openLogbookMeetupId: number | null;

  onLogbookChange: (meetupId: number, sessionNumber: number, value: string) => void;

  onLogbookOpen: (meetupId: number) => void;

  onLogbookClose: () => void;

  onLogbookSave: (meetupId: number, sessionNumber: number) => void;
}

function CrewJournalSection({
  meetups,
  logbookText,
  openLogbookMeetupId,
  onLogbookChange,
  onLogbookOpen,
  onLogbookClose,
  onLogbookSave,
}: CrewJournalSectionProps) {
  if (meetups.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden="true">
          ⚓
        </div>

        <p className={styles.emptyText}>해당 상태의 항해가 없습니다.</p>
      </div>
    );
  }

  return (
    <section className={styles.list}>
      {meetups.map((meetup) => {
        const isLogbookOpen = openLogbookMeetupId === meetup.id;

        const writableSession = meetup.writableLogbookSession;

        const logbookKey = writableSession ? `${meetup.id}-${writableSession.sessionNumber}` : null;

        const currentLogbookText = logbookKey ? (logbookText[logbookKey] ?? '') : '';

        return (
          <article key={meetup.id} className={styles.card}>
            <div className={styles.heading}>
              <h2 className={styles.title}>{meetup.title}</h2>

              <span className={`${styles.status} ${styles[getStatusClassName(meetup.status)]}`}>
                {meetup.status}
              </span>
            </div>

            <p className={styles.members}>
              신청 {meetup.appliedMembers} / {meetup.maxMembers}명 · 확정 {meetup.confirmedMembers}
              명
            </p>

            <p className={styles.schedule}>
              {meetup.period} · {meetup.schedule}
            </p>

            {meetup.status === '항해 중' && writableSession && (
              <div className={styles.logbookArea}>
                {isLogbookOpen ? (
                  <div className={styles.logbookForm}>
                    <div className={styles.logbookEditor}>
                      <p className={styles.logbookTitle}>
                        {writableSession.sessionNumber}
                        회차 : {writableSession.topic} ~{writableSession.deadline}
                      </p>

                      <textarea
                        value={currentLogbookText}
                        onChange={(event) =>
                          onLogbookChange(
                            meetup.id,
                            writableSession.sessionNumber,
                            event.target.value,
                          )
                        }
                        placeholder="독서 후 소감을 자유롭게 작성해 주세요. (400자 이상)"
                        rows={5}
                        className={styles.textarea}
                      />

                      <p className={styles.charCount}>{currentLogbookText.length}자</p>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onLogbookClose}
                      >
                        취소
                      </button>

                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={() => onLogbookSave(meetup.id, writableSession.sessionNumber)}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.openLogbookButton}
                    onClick={() => onLogbookOpen(meetup.id)}
                  >
                    <span aria-hidden="true">📖</span>
                    로그북 작성
                  </button>
                )}
              </div>
            )}

            {meetup.status === '입항 완료' && (
              <Link to={`/meetups/${meetup.id}/reviews/create`} className={styles.reviewButton}>
                <span aria-hidden="true">✍️</span>
                생각의 항해일지 작성
              </Link>
            )}
          </article>
        );
      })}
    </section>
  );
}

function getStatusClassName(status: CrewJournalItem['status']) {
  switch (status) {
    case '승선 대기':
      return 'waiting';

    case '항해 중':
      return 'sailing';

    case '입항 완료':
      return 'completed';
  }
}

export default CrewJournalSection;
