import type { MeetupStatItem, MeetupStats } from '../../types/meetupDetail';

import styles from './CrewStatsSection.module.css';

interface CrewStatsSectionProps {
  stats: MeetupStats;
}

interface StatGroup {
  label: string;
  data: MeetupStatItem[];
}

function CrewStatsSection({ stats }: CrewStatsSectionProps) {
  const totalMembers = stats.age.reduce((total, item) => total + item.count, 0);

  const statGroups: StatGroup[] = [
    {
      label: '연령',
      data: stats.age,
    },
    {
      label: '성별',
      data: stats.gender,
    },
    {
      label: '월 독서량',
      data: stats.reading,
    },
  ];

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>함께하는 크루들</h2>

      <div className={styles.grid}>
        {statGroups.map((group) => (
          <div key={group.label} className={styles.statCard}>
            <p className={styles.statTitle}>{group.label}</p>

            <p className={styles.total}>{totalMembers}명</p>

            <div className={styles.statList}>
              {group.data.map((item) => (
                <div key={item.label} className={styles.statRow}>
                  <span>{item.label}</span>

                  <span className={styles.count}>{item.count}명</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CrewStatsSection;
