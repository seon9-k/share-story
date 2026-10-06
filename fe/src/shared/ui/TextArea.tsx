import type { TextareaHTMLAttributes } from 'react';
import styles from './UI.module.css';
export default function TextArea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${styles.control} ${className}`} {...props} />;
}
