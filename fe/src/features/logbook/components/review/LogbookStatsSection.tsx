import styles from './LogbookStatsSection.module.css';

interface LogbookStatsSectionProps {
  confirmedCount: number;
  submittedCount: number;
  approvedCount: number;
}

function LogbookStatsSection({
  confirmedCount,
  submittedCount,
  approvedCount,
}: LogbookStatsSectionProps) {
  const stats = [
    {
      label: '참여 확정',
      value: `${confirmedCount}명`,
      valueClassName: styles.confirmed,
    },
    {
      label: '선택 회차 제출',
      value: `${submittedCount} / ${confirmedCount}명`,
      valueClassName: styles.submitted,
    },
    {
      label: '선택 회차 승인',
      value: `${approvedCount} / ${confirmedCount}명`,
      valueClassName: styles.approved,
    },
  ];

  return (
    <section className={styles.grid} aria-label="로그북 제출 및 승인 현황">
      {stats.map((stat) => (
        <div key={stat.label} className={styles.card}>
          <div className={`${styles.value} ${stat.valueClassName}`}>{stat.value}</div>

          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </section>
  );
}

export default LogbookStatsSection;
