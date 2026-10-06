import { useId, type ReactNode } from 'react';
import styles from './UI.module.css';
export default function FormSection({
  title,
  number,
  children,
}: {
  title: string;
  number?: number;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {number !== undefined && <span className={styles.number}>{number}</span>}
        {title}
      </h2>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}
