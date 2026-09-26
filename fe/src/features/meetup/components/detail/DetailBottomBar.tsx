import { Link } from 'react-router-dom';

import styles from './DetailBottomBar.module.css';

interface DetailBottomBarProps {
  onJoin: () => void;
}

function DetailBottomBar({ onJoin }: DetailBottomBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Link to="/meetups" className={styles.listButton}>
          목록으로
        </Link>

        <button type="button" className={styles.joinButton} onClick={onJoin}>
          항해 참여하기
        </button>
      </div>
    </div>
  );
}

export default DetailBottomBar;
