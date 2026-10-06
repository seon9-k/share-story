import { NavLink, Outlet } from 'react-router-dom';
import styles from './MyPageLayout.module.css';

export default function MyPageLayout() {
  return (
    <>
      <nav className={styles.nav} aria-label="마이페이지 메뉴">
        <NavLink
          to="/mypage/journal"
          className={({ isActive }) => (isActive ? styles.active : styles.link)}
        >
          나의 항해 일지
        </NavLink>
        <NavLink
          to="/mypage/profile"
          className={({ isActive }) => (isActive ? styles.active : styles.link)}
        >
          나의 회원정보
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
