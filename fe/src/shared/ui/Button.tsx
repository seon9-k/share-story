import type { ButtonHTMLAttributes } from 'react';
import styles from './UI.module.css';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}
export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${variant === 'secondary' ? styles.secondary : ''} ${className}`}
      {...props}
    />
  );
}
