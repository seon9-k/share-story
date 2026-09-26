import type { SelectHTMLAttributes } from 'react';
import styles from './UI.module.css';
export default function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${styles.control} ${className}`} {...props} />;
}
