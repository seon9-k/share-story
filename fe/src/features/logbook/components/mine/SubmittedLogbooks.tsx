import { meetupStatus } from '../../../member';
import { useDocument } from '../../../../shared/hooks/useResource';
import { ActionLink, EmptyState } from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { myLogbooksPath, type MyLogbookGroup } from '../../types/api';
import styles from '../../../../shared/ui/Voyage.module.css';
import groupStyles from './SubmittedLogbooks.module.css';

/**
 * 내가 제출한 로그북 모아보기 (읽기 전용)
 * - 지난 회차의 로그북은 작성 화면에서 보이지 않고 이곳에서만 확인함
 * - 여러 모임에서 작성했다면 모임 단위로 묶고, 그 안에서 회차 순서로 보여줌
 * - 수정·삭제는 '로그북 작성' 탭의 해당 회차에서만 가능함
 * - 탭을 열 때마다 마운트되어 방금 제출한 내용도 최신으로 조회됨
 */
export default function SubmittedLogbooks({ currentMeetupId }: { currentMeetupId: string }) {
  const result = useDocument<MyLogbookGroup[]>(myLogbooksPath);
  return (
    <>
      <RequestState {...result} retry={result.reload} />
      {result.data && !result.data.length && (
        <EmptyState
          title="아직 제출한 로그북이 없어요."
          description="로그북을 제출하면 모임별로 이곳에 모입니다."
        />
      )}
      {result.data?.map(({ meetup, logbooks }) => (
        <section className={groupStyles.group} key={meetup.meetup_id}>
          <div className={groupStyles.groupHeader}>
            <h2 className={groupStyles.groupTitle}>{meetup.title}</h2>
            <span className={groupStyles.groupMeta}>
              {meetup.book_title} · {meetupStatus[meetup.status]} · 제출 {logbooks.length}개
            </span>
            {/* 지금 보고 있는 모임이거나 이미 끝난 모임은 작성 화면으로 보내지 않음 */}
            {meetup.meetup_id !== currentMeetupId && meetup.status !== 'COMPLETED' && (
              <ActionLink to={`/meetups/${meetup.meetup_id}/logbooks`}>로그북 작성하기</ActionLink>
            )}
          </div>
          <div className={styles.sessions}>
            {logbooks.map((logbook) => (
              <article className={styles.session} key={logbook.logbook_id}>
                <h3>
                  {logbook.session_number}회차 · {logbook.topic}
                </h3>
                <p className={styles.meta}>
                  {logbook.sch_date.slice(0, 10)} · 제출{' '}
                  {new Date(logbook.submitted_at).toLocaleDateString('ko-KR')}
                </p>
                <span
                  className={`${styles.badge} ${logbook.is_approved ? styles.submitted : styles.pending}`}
                >
                  {logbook.is_approved ? '확인 완료' : '확인 대기'}
                </span>
                <div className={styles.content}>{logbook.content}</div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
