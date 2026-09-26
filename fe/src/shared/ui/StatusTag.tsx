import type { ReactNode } from 'react';
import styles from './UI.module.css';
export default function StatusTag({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'orange' | 'gray';
}) {
  return <span className={`${styles.tag} ${tone === 'blue' ? '' : styles[tone]}`}>{children}</span>;
}
