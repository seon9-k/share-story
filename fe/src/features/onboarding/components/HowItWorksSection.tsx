import styles from './HowItWorksSection.module.css';

const STEPS = [
  {
    number: '01',
    icon: '🔍',
    title: '항로 탐색',
    description: '관심 장르와 지역, 일정에 맞는 독서 모임을 검색하세요.',
  },
  {
    number: '02',
    icon: '⚓',
    title: '승선 신청',
    description: '마음에 드는 모임에 승선 신청을 하고 캡틴의 승인을 기다립니다.',
  },
  {
    number: '03',
    icon: '📖',
    title: '함께 읽기',
    description: '크루들과 함께 책을 읽고 각자의 생각과 감상을 나눕니다.',
  },
  {
    number: '04',
    icon: '✍️',
    title: '로그북 작성',
    description: '독후감을 로그북에 기록하고 항해의 발자취를 남깁니다.',
  },
];

function HowItWorksSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>이용 방법</p>

          <h2 className={styles.title}>항해의 시작, 네 단계</h2>

          <p className={styles.description}>
            처음이어도 괜찮습니다. 캡틴과 크루가 함께 이끌어 드립니다.
          </p>
        </div>

        <div className={styles.stepGrid}>
          {STEPS.map((step, index) => (
            <article key={step.number} className={styles.stepCard}>
              {index < STEPS.length - 1 && <span className={styles.connector} aria-hidden="true" />}

              <div className={styles.icon} aria-hidden="true">
                {step.icon}
              </div>

              <div className={styles.stepNumber}>{step.number}</div>

              <h3 className={styles.stepTitle}>{step.title}</h3>

              <p className={styles.stepDescription}>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
