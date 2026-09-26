import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { logbookReviewsByMeetup } from '../../mocks/logbookReviewMocks';
import { EmptyState, ActionLink, Notice } from '../../../../shared/ui';

import type { LogbookReviewStatus } from '../../types/logbookReview';

import CrewReportSection from './CrewReportSection';
import LogbookStatsSection from './LogbookStatsSection';
import SessionSelector from './SessionSelector';

import styles from './LogbookReviewView.module.css';

function LogbookReviewView() {
  const { meetupId } = useParams();
  const data = logbookReviewsByMeetup[Number(meetupId)];
  if (!data)
    return (
      <EmptyState
        title="검토할 모임을 찾을 수 없습니다."
        description="나의 항해 일지에서 모임을 다시 선택해 주세요."
        action={<ActionLink to="/my-journal">나의 항해 일지</ActionLink>}
      />
    );
  return <LogbookReviewContent key={data.meetupId} data={data} />;
}

function LogbookReviewContent({
  data,
}: {
  data: NonNullable<(typeof logbookReviewsByMeetup)[number]>;
}) {
  const {
    reports: crewLogbookReportMocks,
    sessions: logbookSessionMocks,
    confirmedCount: confirmedCrewCountMock,
  } = data;
  const [selectedSession, setSelectedSession] = useState(data.sessions[0]?.number ?? 1);

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const [statuses, setStatuses] = useState<Record<number, LogbookReviewStatus>>(() =>
    Object.fromEntries(crewLogbookReportMocks.map((report) => [report.id, report.status])),
  );

  const currentSessionReports = crewLogbookReportMocks.filter(
    (report) => report.sessionNumber === selectedSession,
  );

  const currentReport =
    currentSessionReports.find((report) => report.id === selectedReportId) ?? null;

  const submittedCount = currentSessionReports.filter(
    (report) => statuses[report.id] !== '미제출',
  ).length;

  const approvedCount = currentSessionReports.filter(
    (report) => statuses[report.id] === '승인 완료',
  ).length;

  const handleSessionSelect = (sessionNumber: number) => {
    setSelectedSession(sessionNumber);
    setSelectedReportId(null);
  };

  const handleApprove = (reportId: number) => {
    if (
      !currentSessionReports.some(
        (report) => report.id === reportId && statuses[reportId] === '검토 대기',
      )
    )
      return;
    // Preview only; server approval will be connected later.
    setStatuses((prev) => ({
      ...prev,
      [reportId]: '승인 완료',
    }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <Link to="/my-journal" className={styles.backLink}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            나의 항해 일지
          </Link>

          <p className={styles.eyebrow}>캡틴 검토</p>

          <h1 className={styles.title}>로그북 확인 및 승인</h1>

          <p className={styles.meetupTitle}>{data.title}</p>
        </div>
      </header>

      <div className={styles.content}>
        <Notice>미리보기입니다. 승인 변경은 이 화면에서만 적용됩니다.</Notice>
        <SessionSelector
          sessions={logbookSessionMocks}
          selectedSession={selectedSession}
          onSelect={handleSessionSelect}
        />

        <LogbookStatsSection
          confirmedCount={confirmedCrewCountMock}
          submittedCount={submittedCount}
          approvedCount={approvedCount}
        />

        <CrewReportSection
          reports={currentSessionReports}
          statuses={statuses}
          selectedReportId={selectedReportId}
          selectedSession={selectedSession}
          currentReport={currentReport}
          onSelectReport={setSelectedReportId}
          onApprove={handleApprove}
        />
      </div>
    </div>
  );
}

export default LogbookReviewView;
