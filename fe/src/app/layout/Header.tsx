import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import logoSrc from '../../shared/assets/logo.png';

import styles from './Header.module.css';

const NAV_LINKS = [
  {
    label: '항해 찾기',
    to: '/meetups',
  },
  {
    label: '나의 항해 일지',
    to: '/my-journal',
  },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logoLink} onClick={closeMenu}>
          <img src={logoSrc} alt="Share Story 로고" className={styles.logo} />

          <span className={styles.brandName}>SHARE STORY</span>
        </Link>

        <nav className={styles.desktopNav}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.desktopActions}>
          <Link to="/signup" className={styles.signupLink}>
            회원가입
          </Link>

          <Link to="/meetups" className={styles.boardButton}>
            승선하기
          </Link>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className={styles.mobileNav}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.mobileNavLink} ${isActive ? styles.activeMobileNavLink : ''}`
              }
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}

          <div className={styles.mobileActions}>
            <Link to="/signup" className={styles.mobileSignupLink} onClick={closeMenu}>
              회원가입
            </Link>

            <Link to="/meetups" className={styles.mobileBoardButton} onClick={closeMenu}>
              승선하기
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
