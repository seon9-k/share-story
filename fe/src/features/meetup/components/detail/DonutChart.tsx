import type { MeetupStatItem } from '../../types/meetupDetail';

import styles from './DonutChart.module.css';

interface DonutChartProps {
  data: MeetupStatItem[];
  size?: number;
}

const CHART_COLORS = [
  'var(--color-ocean)',
  'var(--color-action)',
  'var(--color-navy)',
  'var(--color-orange)',
  'var(--color-control)',
  'var(--color-action-hover)',
];

function DonutChart({ data, size = 96 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;

  return (
    <div className={styles.wrapper}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.chart}>
        {total === 0 ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-divider)"
            strokeWidth={strokeWidth}
          />
        ) : (
          data.map((item, index) => {
            const dash = (item.count / total) * circumference;
            const offset = -cumulative;
            cumulative += dash;
            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            );
          })
        )}
      </svg>

      <ul className={styles.legend}>
        {data.length === 0 && <li className={styles.legendItem}>데이터 없음</li>}
        {data.map((item, index) => (
          <li key={item.label} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendCount}>
              {item.count}명{total > 0 ? ` (${Math.round((item.count / total) * 100)}%)` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DonutChart;
