import type { ReactNode } from 'react';
import styles from './UI.module.css';
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action}
    </div>
  );
}
