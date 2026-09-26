import { Link } from 'react-router-dom';

import logoSrc from '../../shared/assets/logo.png';

import styles from './Footer.module.css';

const SERVICE_LINKS = [
  {
    label: '항해 찾기',
    to: '/meetups',
  },
  {
    label: '항해 개설',
    to: '/meetups/create',
  },
  {
    label: '나의 항해 일지',
    to: '/my-journal',
  },
];

const SUPPORT_LINKS = ['자주 묻는 질문', '이용약관', '개인정보처리방침', '문의하기'];

const SOCIAL_LINKS = ['인스타그램', '카카오채널', '뉴스레터'];

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.brandSection}>
            <div className={styles.brand}>
              <img src={logoSrc} alt="Share Story 로고" className={styles.logo} />

              <span className={styles.brandName}>SHARE STORY</span>
            </div>

            <p className={styles.description}>
              책을 매개로 사람이 모이고, 이야기를 나누며 각자의 경험을 더 멀리 연결합니다.
            </p>

            <div className={styles.socialLinks}>
              {SOCIAL_LINKS.map((social) => (
                <span key={social} className={styles.socialBadge}>
                  {social}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.menuTitle}>서비스</p>

            <ul className={styles.menuList}>
              {SERVICE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={styles.menuLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.menuTitle}>고객지원</p>

            <ul className={styles.menuList}>
              {SUPPORT_LINKS.map((label) => (
                <li key={label}>
                  <span className={styles.supportItem}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 Share Story. All rights reserved.</span>
          <span>Book · People · Story</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
