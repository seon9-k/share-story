import { Link } from 'react-router-dom';

import styles from './DetailBottomBar.module.css';

interface DetailBottomBarProps {
  meetupId: number;
  canEdit: boolean;
  // 승선 대기(모집 중)일 때만 신청 가능. 마감·항해 중·항해 완료는 신청 불가
  canJoin: boolean;
  onJoin: () => void;
  isJoining?: boolean;
}

function DetailBottomBar({
  meetupId,
  canEdit,
  canJoin,
  onJoin,
  isJoining = false,
}: DetailBottomBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Link to="/meetups" className={styles.listButton}>
          목록으로
        </Link>

        {/* 수정 권한은 모임을 만든 사람에게만 있으므로 다른 사용자에게는 버튼 자체를 보여주지 않음 (이전: 비활성 버튼) */}
        {canEdit && (
          <Link to={`/meetups/${meetupId}/edit`} className={styles.editButton}>
            항해수정
          </Link>
        )}

        {/* 본인이 개설한 항해에는 신청할 수 없으므로 버튼 자체를 보여주지 않음. 모집이 끝난 항해는 비활성화함 */}
        {!canEdit && (
          <button
            type="button"
            className={styles.joinButton}
            onClick={onJoin}
            disabled={!canJoin || isJoining}
            title={!canJoin ? '모집이 마감된 항해입니다.' : undefined}
          >
            {isJoining ? '신청 중...' : canJoin ? '항해 참여하기' : '승선 마감'}
          </button>
        )}
      </div>
    </div>
  );
}

export default DetailBottomBar;
