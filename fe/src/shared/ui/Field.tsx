import type { ReactNode } from 'react';
import styles from './UI.module.css';
export default function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required && <b>필수</b>}
      </span>
      {children}
      {hint && <small className={styles.hint}>{hint}</small>}
    </label>
  );
}
