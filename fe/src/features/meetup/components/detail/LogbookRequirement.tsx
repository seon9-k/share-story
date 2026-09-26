import styles from './LogbookRequirement.module.css';

function LogbookRequirement() {
  return (
    <section className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        📖
      </span>

      <div>
        <h2 className={styles.title}>참여 전, 로그북을 준비해 주세요</h2>

        <div className={styles.requirements}>
          <span>400자 이상 · 최소 글자 수</span>
          <span>항해 D-2 · 제출 마감</span>
        </div>
      </div>
    </section>
  );
}

export default LogbookRequirement;
