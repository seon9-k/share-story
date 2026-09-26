import type { LogbookSession } from '../../types/logbookReview';

import styles from './SessionSelector.module.css';

interface SessionSelectorProps {
  sessions: LogbookSession[];
  selectedSession: number;
  onSelect: (sessionNumber: number) => void;
}

function SessionSelector({ sessions, selectedSession, onSelect }: SessionSelectorProps) {
  const currentSession = sessions.find((session) => session.number === selectedSession);

  return (
    <section className={styles.card}>
      <p className={styles.label}>회차 선택</p>

      <div className={styles.sessionList}>
        {sessions.map((session) => {
          const isSelected = selectedSession === session.number;

          return (
            <button
              key={session.number}
              type="button"
              className={`${styles.sessionButton} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(session.number)}
              aria-pressed={isSelected}
            >
              <span>{session.number}회차</span>

              <span className={styles.date}>· {session.date}</span>
            </button>
          );
        })}
      </div>

      {currentSession && <p className={styles.topic}>{currentSession.topic}</p>}
    </section>
  );
}

export default SessionSelector;
