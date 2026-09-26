import { Link, type LinkProps } from 'react-router-dom';
import styles from './UI.module.css';
export default function ActionLink({ className = '', ...props }: LinkProps) {
  return <Link className={`${styles.button} ${styles.secondary} ${className}`} {...props} />;
}
