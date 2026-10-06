import type { ReactNode } from 'react';
import styles from './UI.module.css';
export default function PageContainer({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return <div className={`${styles.page} ${narrow ? styles.narrow : ''}`}>{children}</div>;
}
