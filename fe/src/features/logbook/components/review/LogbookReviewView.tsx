import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  memberPath,
  sessionStatus,
  type MemberSession,
  useMeetupDetail,
  type Crew,
} from '../../../member';
import { useAllPages, useDocument } from '../../../../shared/hooks/useResource';
import {
  PageContainer,
  PageHeading,
  ActionLink,
  EmptyState,
  Select,
  Button,
  Notice,
} from '../../../../shared/ui';
import { documentRequest } from '../../../../shared/api/client';
import RequestState from '../../../../shared/ui/RequestState';
import { approvalPath, logbookPath, type CrewLogbook } from '../../types/api';
import styles from '../../../../shared/ui/Voyage.module.css';

export default function LogbookReviewView() {
  const { meetupId = '' } = useParams();
  const [search, setSearch] = useSearchParams();
  const sessions = useDocument<MemberSession[]>(`${memberPath(meetupId)}/sessions`);
  const crews = useAllPages<Crew>(`${memberPath(meetupId)}/crews`);
  const detail = useMeetupDetail(meetupId);
  const selected =
    sessions.data?.find((s) => String(s.session_id) === search.get('session')) ||
    sessions.data?.[0];
  return (
    <div className={styles.page}>
      <PageContainer>
        <ActionLink to="/mypage/journal?role=captain">← 캡틴의 항해 일지</ActionLink>
        <PageHeading
          eyebrow="CAPTAIN'S LOGBOOK"
          title={detail.data?.meetup.title || '크루의 항해 일지'}
          description="회차를 선택하고 크루가 남긴 이야기를 읽어보세요."
        />
        <RequestState {...sessions} retry={sessions.reload} />
        <RequestState {...crews} retry={crews.reload} />
        {crews.data && (
          <div className={styles.summary}>
            참여 크루 {crews.data.length}명 ·{' '}
            {crews.data.map((c) => c.name || c.user_id).join(', ') ||
              '아직 참여한 크루가 없습니다.'}
          </div>
        )}
        {sessions.data?.length === 0 && (
          <EmptyState
            title="등록된 세션이 없습니다."
            description="모임의 세션 일정을 확인해 주세요."
          />
        )}
        {selected && !crews.error && (
          <>
            <label className={styles.actions}>
              세션 선택{' '}
              <Select
                value={String(selected.session_id)}
                onChange={(event) => setSearch({ session: event.target.value })}
              >
                {sessions.data?.map((s) => (
                  <option key={s.session_id} value={String(s.session_id)}>
                    {s.session_number}회차 · {s.topic} · {sessionStatus[s.status]}
                  </option>
                ))}
              </Select>
            </label>
            {/* 세션이 바뀌면 이전 세션에서 선택한 크루 초기화 */}
            <SessionReports
              key={`${meetupId}:${selected.session_id}`}
              meetupId={meetupId}
              sessionId={String(selected.session_id)}
            />
          </>
        )}
      </PageContainer>
    </div>
  );
}
function SessionReports({ meetupId, sessionId }: { meetupId: string; sessionId: string }) {
  const result = useAllPages<CrewLogbook>(logbookPath(meetupId, sessionId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 승인·취소한 결과를 목록 재조회 없이 바로 반영 (apply_id → 승인 여부)
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState('');
  // 목록 응답에 로그북 본문도 포함되므로 크루 선택 시 추가 API 호출 불필요
  const report = result.data?.find((item) => String(item.apply_id) === selectedId);
  // Apply.status는 참여 상태. 제출 여부는 BE가 반환한 logbook의 null 여부로 판단
  const submitted = result.data?.filter((item) => item.logbook !== null).length || 0;
  const isApproved = (item: CrewLogbook) =>
    approvals[item.apply_id] ?? item.logbook?.is_approved ?? false;

  // 숙제 확인 완료(승인) / 확인 취소. 크루가 로그북을 다시 제출하면 BE가 승인을 해제함
  async function setApproval(item: CrewLogbook, next: boolean) {
    if (!item.logbook) return;
    setPendingId(item.apply_id);
    setApprovalError('');
    try {
      await documentRequest(approvalPath(meetupId, sessionId, item.logbook.logbook_id), {
        method: 'PATCH',
        body: JSON.stringify({ is_approved: next }),
      });
      setApprovals((current) => ({ ...current, [item.apply_id]: next }));
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : '확인 처리에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <RequestState {...result} retry={result.reload} />
      {result.data && (
        <p className={styles.meta}>
          제출 {submitted}명 · 미제출 {result.data.length - submitted}명
        </p>
      )}
      {result.data?.length === 0 && (
        <EmptyState
          title="참여한 크루가 없습니다."
          description="크루가 참여하면 이곳에 표시됩니다."
        />
      )}
      {!!result.data?.length && (
        <div className={styles.split}>
          <div className={styles.list} aria-label="크루별 제출 현황">
            {result.data.map((item) => (
              <button
                key={item.apply_id}
                className={styles.crew}
                aria-pressed={selectedId === String(item.apply_id)}
                onClick={() => setSelectedId(String(item.apply_id))}
              >
                <span>{item.name || item.user_id}</span>
                <span
                  className={`${styles.badge} ${item.logbook ? styles.submitted : styles.pending}`}
                >
                  {item.logbook ? (isApproved(item) ? '확인 완료' : '제출 완료') : '미제출'}
                </span>
              </button>
            ))}
          </div>
          <section className={styles.card} aria-live="polite">
            {report ? (
              <>
                <h2>{report.name || report.user_id}님의 로그북</h2>
                {report.logbook ? (
                  <>
                    <p className={styles.meta}>
                      {report.logbook.submitted_at
                        ? new Date(report.logbook.submitted_at).toLocaleString('ko-KR')
                        : ''}
                    </p>
                    <div className={styles.content}>{report.logbook.content}</div>
                    <p className={styles.meta}>
                      {isApproved(report)
                        ? '숙제 확인이 완료되어 Zoom 접속 정보가 메일로 발송됩니다.'
                        : '확인을 완료해야 이 크루에게 Zoom 접속 정보가 발송됩니다.'}
                    </p>
                    <Button
                      variant={isApproved(report) ? 'secondary' : 'primary'}
                      disabled={pendingId === report.apply_id}
                      onClick={() => setApproval(report, !isApproved(report))}
                    >
                      {pendingId === report.apply_id
                        ? '처리 중...'
                        : isApproved(report)
                          ? '확인 취소'
                          : '숙제 확인 완료'}
                    </Button>
                    {approvalError && <Notice>{approvalError}</Notice>}
                  </>
                ) : (
                  <p>아직 로그북을 제출하지 않았습니다.</p>
                )}
              </>
            ) : (
              <p>크루를 선택하면 로그북을 확인할 수 있습니다.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
