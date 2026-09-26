import type { InputHTMLAttributes } from 'react';
import styles from './UI.module.css';
export default function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${styles.control} ${className}`} {...props} />;
}
