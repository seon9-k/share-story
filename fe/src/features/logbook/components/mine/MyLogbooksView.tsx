import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { memberPath, sessionStatus, useMeetupDetail, type MemberSession } from '../../../member';
import { documentRequest } from '../../../../shared/api/client';
import { useDocument, useResource } from '../../../../shared/hooks/useResource';
import {
  ActionLink,
  Button,
  EmptyState,
  PageContainer,
  PageHeading,
  Notice,
} from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import { logbookPath, type Logbook } from '../../types/api';
import LogbookEditor from '../write/LogbookEditor';
import styles from '../../../../shared/ui/Voyage.module.css';

export default function MyLogbooksView() {
  const { meetupId = '' } = useParams();
  const sessions = useDocument<MemberSession[]>(`${memberPath(meetupId)}/sessions`);
  const detail = useMeetupDetail(meetupId);
  return (
    <div className={styles.page}>
      <PageContainer>
        <ActionLink to="/mypage/journal?role=crew">← 크루의 항해 일지</ActionLink>
        <PageHeading
          eyebrow="MY LOGBOOK"
          title={detail.data?.meetup.title || '나의 로그북'}
          description="회차마다 읽고 나눈 생각을 남겨보세요."
        />
        <RequestState {...sessions} retry={sessions.reload} />
        {sessions.data && (
          <SessionLogbooks
            key={meetupId}
            meetupId={meetupId}
            sessions={sessions.data}
            completed={detail.data?.meetup.status === 'COMPLETED'}
          />
        )}
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
function SessionLogbooks({
  meetupId,
  sessions,
  completed,
}: {
  meetupId: string;
  sessions: MemberSession[];
  completed: boolean;
}) {
  const [mode, setMode] = useState<'write' | 'mine'>('write');
  // 제출(Logbook)·삭제(null) 결과를 회차별로 보관. null이 조회 결과를 덮어 미제출로 표시
  const [saved, setSaved] = useState<Record<string, Logbook | null>>({});
  const [message, setMessage] = useState('');
  // 내 로그북 목록 전용 API가 없어 모임의 각 세션에 대해 /me를 조회해 모음
  const load = useCallback(
    async (signal: AbortSignal) => {
      const pairs = await Promise.all(
        sessions.map(
          async (session) =>
            [
              String(session.session_id),
              await documentRequest<Logbook | null>(
                `${logbookPath(meetupId, String(session.session_id))}/me`,
                { signal },
              ),
            ] as const,
        ),
      );
      return Object.fromEntries(pairs);
    },
    [meetupId, sessions],
  );
  const result = useResource(`my-logbooks:${meetupId}`, load);
  // 제출 성공 응답을 초기 조회 결과보다 우선하여 내용과 제출 표시를 즉시 갱신
  const books = { ...result.data, ...saved };
  const visible = mode === 'mine' ? sessions.filter((s) => books[String(s.session_id)]) : sessions;
  return (
    <>
      <div className={styles.tabs} aria-label="로그북 보기 방식">
        <button aria-pressed={mode === 'write'} onClick={() => setMode('write')}>
          회차별 작성
        </button>
        <button aria-pressed={mode === 'mine'} onClick={() => setMode('mine')}>
          내가 제출한 로그북
        </button>
      </div>
      <RequestState {...result} retry={result.reload} />
      {message && <Notice>{message}</Notice>}
      {result.data && (
        <>
          {!visible.length && (
            <EmptyState
              title={mode === 'mine' ? '아직 제출한 로그북이 없어요.' : '등록된 세션이 없어요.'}
              description="로그북을 제출하면 회차별로 이곳에 모입니다."
            />
          )}
          <div className={styles.sessions}>
            {sessions.map((session) => {
              const sessionId = String(session.session_id);
              const book = books[sessionId] || null;
              // 완료된 모임은 모든 회차, 다음 세션이 시작된 회차는 제출본이 있을 때 수정 불가
              const lockedMessage = completed
                ? '완료된 모임에는 로그북을 작성하거나 수정할 수 없습니다.'
                : book && isLocked(session, sessions)
                  ? '다음 세션이 시작되어 이 로그북은 더 이상 수정할 수 없습니다.'
                  : undefined;
              return (
                <article
                  className={styles.session}
                  key={sessionId}
                  hidden={!visible.includes(session)}
                >
                  <h2>
                    {session.session_number}회차 · {session.topic}
                  </h2>
                  <p className={styles.meta}>
                    {session.sch_date} · {session.sch_st_time}–{session.sch_ed_time} ·{' '}
                    {sessionStatus[session.status]}
                  </p>
                  <span className={`${styles.badge} ${book ? styles.submitted : styles.pending}`}>
                    {book ? '제출 완료' : '미제출'}
                  </span>
                  {mode === 'mine' && book && <div className={styles.content}>{book.content}</div>}
                  {/* 탭 전환 시 편집기를 제거하지 않아 아직 제출하지 않은 입력 유지 */}
                  <div hidden={mode === 'mine'}>
                    <details className={styles.editor}>
                      <summary>
                        {lockedMessage
                          ? book
                            ? '작성한 로그북 보기'
                            : '로그북 (작성 기간 종료)'
                          : book
                            ? '작성한 로그북 보기·수정'
                            : '로그북 작성'}
                      </summary>
                      <LogbookEditor
                        meetupId={meetupId}
                        session={session}
                        logbook={book}
                        lockedMessage={lockedMessage}
                        onSaved={(value) => {
                          setSaved((previous) => ({ ...previous, [sessionId]: value }));
                          setMessage(`${session.session_number}회차 로그북을 제출했습니다.`);
                        }}
                        onDeleted={() => {
                          setSaved((previous) => ({ ...previous, [sessionId]: null }));
                          setMessage(`${session.session_number}회차 로그북을 삭제했습니다.`);
                        }}
                      />
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setMode(mode === 'mine' ? 'write' : 'mine')}>
              {mode === 'mine' ? '로그북 작성하기' : '제출한 로그북 모아보기'}
            </Button>
            <ActionLink to={`/meetups/${meetupId}/reviews`}>항해 후기</ActionLink>
          </div>
        </>
      )}
    </>
  );
}
