import styles from './VocabularySection.module.css';

const VOCABULARY = [
  {
    word: '캡틴',
    definition: '모임장',
    icon: '⚓',
  },
  {
    word: '크루',
    definition: '모임원',
    icon: '👥',
  },
  {
    word: '로그북',
    definition: '독후감',
    icon: '📖',
  },
  {
    word: '항해일지',
    definition: '입항 후 후기',
    icon: '✍️',
  },
];

function VocabularySection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>항해의 언어</p>

        <div className={styles.grid}>
          {VOCABULARY.map((item) => (
            <article key={item.word} className={styles.card}>
              <div className={styles.icon} aria-hidden="true">
                {item.icon}
              </div>

              <h3 className={styles.word}>{item.word}</h3>

              <p className={styles.definition}>{item.definition}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default VocabularySection;
