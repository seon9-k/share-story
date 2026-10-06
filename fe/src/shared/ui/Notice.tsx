import type { ReactNode } from 'react';
import styles from './UI.module.css';
export default function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className={styles.notice}>
      {children}
    </p>
  );
}
