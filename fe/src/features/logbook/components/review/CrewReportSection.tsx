import type { CrewLogbookReport, LogbookReviewStatus } from '../../types/logbookReview';

import styles from './CrewReportSection.module.css';

interface CrewReportSectionProps {
  reports: CrewLogbookReport[];
  statuses: Record<number, LogbookReviewStatus>;
  selectedReportId: number | null;
  selectedSession: number;
  currentReport: CrewLogbookReport | null;

  onSelectReport: (reportId: number) => void;
  onApprove: (reportId: number) => void;
}

function CrewReportSection({
  reports,
  statuses,
  selectedReportId,
  selectedSession,
  currentReport,
  onSelectReport,
  onApprove,
}: CrewReportSectionProps) {
  return (
    <section className={styles.layout}>
      <div className={styles.crewPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>신청 크루 / 제출 현황</h2>
        </div>

        <div>
          {reports.map((report) => {
            const status = statuses[report.id];
            const isNotSubmitted = status === '미제출';
            const isSelected = selectedReportId === report.id;

            return (
              <button
                key={report.id}
                type="button"
                className={`${styles.crewItem} ${
                  isSelected ? styles.selectedCrewItem : ''
                } ${isNotSubmitted ? styles.disabledCrewItem : ''}`}
                onClick={() => onSelectReport(report.id)}
                disabled={isNotSubmitted}
              >
                <div className={styles.avatar}>{report.id}</div>

                <div className={styles.crewInfo}>
                  <p className={styles.crewName}>{report.label}</p>

                  <p className={styles.charCount}>
                    {report.chars > 0 ? `${report.chars}자` : '미제출'}
                  </p>
                </div>

                <span className={`${styles.status} ${styles[getStatusClassName(status)]}`}>
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.reportPanel}>
        {currentReport && statuses[currentReport.id] !== '미제출' ? (
          <>
            <div className={styles.reportHeader}>
              <p className={styles.reportTitle}>
                {currentReport.label} · {selectedSession}회차
              </p>

              <p className={styles.reportMeta}>
                {currentReport.chars}자 / {currentReport.submittedAt ?? '—'} 제출
              </p>
            </div>

            <div className={styles.reportContent}>
              <p className={styles.reportText}>{currentReport.content}</p>

              <p className={styles.readOnlyNotice}>읽기 전용 · 승인과 본문 수정은 별개</p>
            </div>

            <div className={styles.reportActions}>
              {statuses[currentReport.id] === '승인 완료' ? (
                <div className={styles.approvedMessage}>✓ 승인 완료</div>
              ) : (
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={() => onApprove(currentReport.id)}
                >
                  탑승 승인
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyReport}>
            <div>
              <div className={styles.emptyIcon} aria-hidden="true">
                📖
              </div>

              <p className={styles.emptyText}>
                크루를 선택하면
                <br />
                로그북 내용을 확인할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getStatusClassName(status: LogbookReviewStatus) {
  switch (status) {
    case '검토 대기':
      return 'pending';

    case '승인 완료':
      return 'approved';

    case '미제출':
      return 'notSubmitted';
  }
}

export default CrewReportSection;
