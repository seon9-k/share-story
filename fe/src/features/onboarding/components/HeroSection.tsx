import { Link } from 'react-router-dom';

import logoSrc from '../../../shared/assets/logo.png';

import styles from './HeroSection.module.css';

const STATS = [
  { value: '1,240+', label: '크루' },
  { value: '320+', label: '항해 완료' },
  { value: '48+', label: '현재 항해 중' },
];

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.background} aria-hidden="true">
        <svg viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice">
          <path
            d="M0,300 C360,200 720,400 1080,280 C1260,220 1380,340 1440,300 L1440,560 L0,560Z"
            fill="#2F6B8A"
          />
          <path
            d="M0,380 C300,300 600,440 900,360 C1100,310 1300,420 1440,380 L1440,560 L0,560Z"
            fill="#F47A3C"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Book · People · Story
          </div>

          <h1 className={styles.title}>
            책으로 모이고,
            <br />
            <span>이야기로</span>
            <br />
            항해합니다.
          </h1>

          <p className={styles.description}>
            함께 읽는 이야기, 더 멀리.
            <br />
            책을 매개로 사람이 모이고, 이야기를 나누며
            <br />
            각자의 경험을 더 멀리 연결합니다.
          </p>

          <div className={styles.actions}>
            <Link to="/meetups" className={styles.primaryButton}>
              모임 탐색하기
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link to="/signup" className={styles.secondaryButton}>
              회원가입
            </Link>
          </div>

          <div className={styles.stats}>
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className={styles.statValue}>{stat.value}</div>

                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoGlow} />

            <img src={logoSrc} alt="Share Story 로고" className={styles.logo} />
          </div>
        </div>
      </div>

      <div className={styles.wave} aria-hidden="true">
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none">
          <path
            d="M0,32 C360,64 720,0 1080,48 C1260,64 1380,32 1440,48 L1440,64 L0,64Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </section>
  );
}

export default HeroSection;
