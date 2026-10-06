import { Link } from 'react-router-dom';

import logoSrc from '../../../shared/assets/logo.png';

import styles from './CtaSection.module.css';

function CtaSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <img src={logoSrc} alt="Share Story 로고" className={styles.logo} />

        <h2 className={styles.title}>지금 바로 항해를 시작하세요</h2>

        <p className={styles.description}>
          책을 사랑하는 사람들이 모여 이야기를 나누는 곳,
          <br />
          당신의 자리가 기다리고 있습니다.
        </p>

        <div className={styles.actions}>
          <Link to="/meetups" className={styles.primaryButton}>
            모임 탐색하기
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link to="/meetups/create" className={styles.secondaryButton}>
            모임 만들기
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
