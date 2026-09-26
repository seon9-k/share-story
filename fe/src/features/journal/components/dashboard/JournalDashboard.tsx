import { Notice } from '../../../../shared/ui';
import { useState } from 'react';

import { captainJournalMocks, crewJournalMocks } from '../../mocks/journalMocks';
import { currentUserMock } from '../../../user';

import type { CaptainJournalTab, CrewJournalTab, JournalView } from '../../types/journal';

import CaptainJournalSection from './CaptainJournalSection';
import CrewJournalSection from './CrewJournalSection';
import JournalHeader from './JournalHeader';

import styles from './JournalDashboard.module.css';

const CREW_TABS: CrewJournalTab[] = ['전체', '승선 대기', '항해 중', '입항 완료'];

const CAPTAIN_TABS: CaptainJournalTab[] = ['전체', '모집 중', '모집 마감', '종료'];

function JournalDashboard({ initialView = 'crew' }: { initialView?: JournalView }) {
  const [message, setMessage] = useState('');
  const [view, setView] = useState<JournalView>(initialView);

  const [crewTab, setCrewTab] = useState<CrewJournalTab>('항해 중');

  const [captainTab, setCaptainTab] = useState<CaptainJournalTab>('전체');

  const [logbookText, setLogbookText] = useState<Record<string, string>>({});

  const [openLogbookMeetupId, setOpenLogbookMeetupId] = useState<number | null>(null);

  const filteredCrewMeetups =
    crewTab === '전체'
      ? crewJournalMocks
      : crewJournalMocks.filter((meetup) => meetup.status === crewTab);

  const filteredCaptainMeetups =
    captainTab === '전체'
      ? captainJournalMocks
      : captainJournalMocks.filter((meetup) => meetup.status === captainTab);

  const getLogbookKey = (meetupId: number, sessionNumber: number) => `${meetupId}-${sessionNumber}`;

  const handleLogbookChange = (meetupId: number, sessionNumber: number, value: string) => {
    const key = getLogbookKey(meetupId, sessionNumber);

    setLogbookText((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLogbookSave = (meetupId: number, sessionNumber: number) => {
    const key = getLogbookKey(meetupId, sessionNumber);

    setMessage(
      logbookText[key]?.trim()
        ? '로그북 저장은 아직 준비 중입니다. 입력 내용은 이 화면을 떠나면 사라집니다.'
        : '로그북 내용을 입력해 주세요.',
    );
  };

  return (
    <div className={styles.page}>
      <JournalHeader
        user={currentUserMock}
        view={view}
        crewTab={crewTab}
        captainTab={captainTab}
        crewTabs={CREW_TABS}
        captainTabs={CAPTAIN_TABS}
        onViewChange={setView}
        onCrewTabChange={setCrewTab}
        onCaptainTabChange={setCaptainTab}
      />

      <div className={styles.content}>
        {message && <Notice>{message}</Notice>}
        {view === 'crew' ? (
          <CrewJournalSection
            meetups={filteredCrewMeetups}
            logbookText={logbookText}
            openLogbookMeetupId={openLogbookMeetupId}
            onLogbookChange={handleLogbookChange}
            onLogbookOpen={setOpenLogbookMeetupId}
            onLogbookClose={() => setOpenLogbookMeetupId(null)}
            onLogbookSave={handleLogbookSave}
          />
        ) : (
          <CaptainJournalSection meetups={filteredCaptainMeetups} />
        )}
      </div>
    </div>
  );
}

export default JournalDashboard;
