import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './UI.module.css';

const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${styles.control} ${className}`} {...props} />
  ),
);

export default TextInput;
