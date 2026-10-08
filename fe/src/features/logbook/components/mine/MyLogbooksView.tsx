import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { memberPath, sessionStatus, useMeetupDetail, type MemberSession } from '../../../member';
import { documentRequest } from '../../../../shared/api/client';
import { useDocument, useResource } from '../../../../shared/hooks/useResource';
import {
  ActionLink,
  EmptyState,
  PageContainer,
  PageHeading,
  Notice,
} from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { findTargetSession } from '../../lib/targetSession';
import { logbookPath, type Logbook } from '../../types/api';
import LogbookEditor from '../write/LogbookEditor';
import SubmittedLogbooks from './SubmittedLogbooks';
import styles from '../../../../shared/ui/Voyage.module.css';

export default function MyLogbooksView() {
  const { meetupId = '' } = useParams();
  const [mode, setMode] = useState<'write' | 'mine'>('write');
  const sessions = useDocument<MemberSession[]>(`${memberPath(meetupId)}/sessions`);
  const detail = useMeetupDetail(meetupId);
  return (
    <div className={styles.page}>
      <PageContainer>
        <ActionLink to="/mypage/journal?role=crew">← 크루의 항해 일지</ActionLink>
        <PageHeading
          eyebrow="MY LOGBOOK"
          title={mode === 'mine' ? '제출한 로그북' : detail.data?.meetup.title || '나의 로그북'}
          description={
            mode === 'mine'
              ? '모임별로 제출한 로그북을 모아서 볼 수 있어요.'
              : '다음 회차를 위해 읽고 나눌 생각을 남겨보세요.'
          }
        />
        <div className={styles.tabs} aria-label="로그북 보기 방식">
          <button aria-pressed={mode === 'write'} onClick={() => setMode('write')}>
            로그북 작성
          </button>
          <button aria-pressed={mode === 'mine'} onClick={() => setMode('mine')}>
            제출한 로그북
          </button>
        </div>
        {/* 탭을 옮겨도 작성 영역을 제거하지 않아 아직 제출하지 않은 입력을 유지함 */}
        <div hidden={mode !== 'write'}>
          <RequestState {...sessions} retry={sessions.reload} />
          {sessions.data && (
            <WriteLogbook
              key={meetupId}
              meetupId={meetupId}
              sessions={sessions.data}
              completed={detail.data?.meetup.status === 'COMPLETED'}
            />
          )}
        </div>
        {/* 열 때마다 새로 조회해 방금 제출한 내용이 바로 보이게 함 */}
        {mode === 'mine' && <SubmittedLogbooks currentMeetupId={meetupId} />}
        <div className={styles.actions}>
          <ActionLink to={`/meetups/${meetupId}/reviews`}>항해 후기</ActionLink>
        </div>
      </PageContainer>
    </div>
  );
}
// 다음 회차(취소 제외)가 시작되면 이전 회차의 로그북은 수정 불가. BE도 같은 규칙으로 검증
// 시작 시각은 KST 기준
function isLocked(session: MemberSession, sessions: MemberSession[]) {
  const next = sessions
    .filter((item) => item.session_number > session.session_number && item.status !== 'CANCELLED')
    .sort((a, b) => a.session_number - b.session_number)[0];
  if (!next) return false;
  return (
    Date.now() >= new Date(`${next.sch_date.slice(0, 10)}T${next.sch_st_time}:00+09:00`).getTime()
  );
}
/**
 * 로그북 작성 탭: 모든 회차를 나열하지 않고 해당 회차(다음 예정 회차) 하나와 그 로그북만 보여줌
 * 지난 회차의 로그북은 '제출한 로그북' 탭에서만 확인함
 */
function WriteLogbook({
  meetupId,
  sessions,
  completed,
}: {
  meetupId: string;
  sessions: MemberSession[];
  completed: boolean;
}) {
  const target = findTargetSession(sessions);
  if (!target)
    return (
      <EmptyState
        title="작성할 회차가 없어요."
        description="지난 회차의 로그북은 '제출한 로그북'에서 확인할 수 있어요."
      />
    );
  return (
    // 회차가 바뀌면(자정 이후 재방문 등) 이전 회차의 입력·상태가 남지 않도록 회차별로 새로 시작함
    <TargetSession
      key={target.session_id}
      meetupId={meetupId}
      session={target}
      sessions={sessions}
      completed={completed}
    />
  );
}
function TargetSession({
  meetupId,
  session,
  sessions,
  completed,
}: {
  meetupId: string;
  session: MemberSession;
  sessions: MemberSession[];
  completed: boolean;
}) {
  // 제출(Logbook)·삭제(null) 결과를 보관. undefined면 조회 결과를 사용하고, null은 조회 결과를 덮어 미제출로 표시
  const [saved, setSaved] = useState<Logbook | null | undefined>(undefined);
  const [message, setMessage] = useState('');
  // 해당 회차의 내 로그북만 조회함 (이전에는 모든 회차를 조회했음)
  const load = useCallback(
    (signal: AbortSignal) =>
      documentRequest<Logbook | null>(`${logbookPath(meetupId, String(session.session_id))}/me`, {
        signal,
      }),
    [meetupId, session.session_id],
  );
  const result = useResource(`my-logbook:${meetupId}:${session.session_id}`, load);
  const book = (saved !== undefined ? saved : result.data) ?? null;
  // 완료된 모임은 모든 회차, 다음 세션이 시작된 회차는 제출본이 있을 때 수정 불가
  const lockedMessage = completed
    ? '완료된 모임에는 로그북을 작성하거나 수정할 수 없습니다.'
    : book && isLocked(session, sessions)
      ? '다음 세션이 시작되어 이 로그북은 더 이상 수정할 수 없습니다.'
      : undefined;
  return (
    <>
      <RequestState {...result} retry={result.reload} />
      {message && <Notice>{message}</Notice>}
      {result.data !== undefined && (
        <article className={styles.session}>
          <h2>
            {session.session_number}회차 · {session.topic}
          </h2>
          <p className={styles.meta}>
            {session.sch_date.slice(0, 10)} · {session.sch_st_time}–{session.sch_ed_time} ·{' '}
            {sessionStatus[session.status]}
          </p>
          <span className={`${styles.badge} ${book ? styles.submitted : styles.pending}`}>
            {book ? '제출 완료' : '미제출'}
          </span>
          <LogbookEditor
            meetupId={meetupId}
            session={session}
            logbook={book}
            lockedMessage={lockedMessage}
            onSaved={(value) => {
              setSaved(value);
              setMessage(`${session.session_number}회차 로그북을 제출했습니다.`);
            }}
            onDeleted={() => {
              setSaved(null);
              setMessage(`${session.session_number}회차 로그북을 삭제했습니다.`);
            }}
          />
        </article>
      )}
    </>
  );
}
