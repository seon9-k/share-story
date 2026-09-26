import type { UserProfile } from '../../../user';

import type { CaptainJournalTab, CrewJournalTab, JournalView } from '../../types/journal';

import styles from './JournalHeader.module.css';

interface JournalHeaderProps {
  user: UserProfile;

  view: JournalView;

  crewTab: CrewJournalTab;
  captainTab: CaptainJournalTab;

  crewTabs: CrewJournalTab[];
  captainTabs: CaptainJournalTab[];

  onViewChange: (view: JournalView) => void;
  onCrewTabChange: (tab: CrewJournalTab) => void;
  onCaptainTabChange: (tab: CaptainJournalTab) => void;
}

function JournalHeader({
  user,
  view,
  crewTab,
  captainTab,
  crewTabs,
  captainTabs,
  onViewChange,
  onCrewTabChange,
  onCaptainTabChange,
}: JournalHeaderProps) {
  const currentTabs = view === 'crew' ? crewTabs : captainTabs;

  const currentTab = view === 'crew' ? crewTab : captainTab;

  const handleTabChange = (tab: CrewJournalTab | CaptainJournalTab) => {
    if (view === 'crew') {
      onCrewTabChange(tab as CrewJournalTab);
      return;
    }

    onCaptainTabChange(tab as CaptainJournalTab);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>나의 공간</p>

        <h1 className={styles.title}>나의 항해 일지</h1>

        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">
            {user.name.charAt(0)}
          </div>

          <div>
            <p className={styles.userName}>{user.name} 님</p>

            <p className={styles.email}>{user.email}</p>
          </div>
        </div>

        <div className={styles.viewToggle} aria-label="항해 일지 유형">
          <button
            type="button"
            className={`${styles.viewButton} ${view === 'crew' ? styles.activeViewButton : ''}`}
            onClick={() => onViewChange('crew')}
            aria-pressed={view === 'crew'}
          >
            크루 일지
          </button>

          <button
            type="button"
            className={`${styles.viewButton} ${view === 'captain' ? styles.activeViewButton : ''}`}
            onClick={() => onViewChange('captain')}
            aria-pressed={view === 'captain'}
          >
            캡틴 일지
          </button>
        </div>

        <div className={styles.tabBar}>
          {currentTabs.map((tab) => {
            const isActive = currentTab === tab;

            return (
              <button
                key={tab}
                type="button"
                className={`${styles.tabButton} ${isActive ? styles.activeTabButton : ''}`}
                onClick={() => handleTabChange(tab)}
                aria-pressed={isActive}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default JournalHeader;
