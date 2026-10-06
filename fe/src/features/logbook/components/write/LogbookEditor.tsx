import { useId, useState, useEffect } from 'react';
import type { MemberSession } from '../../../member';
import { documentRequest } from '../../../../shared/api/client';
import { Button, Notice, TextArea } from '../../../../shared/ui';
import { logbookPath, type Logbook } from '../../types/api';
import styles from '../../../../shared/ui/Voyage.module.css';

export default function LogbookEditor({
  meetupId,
  session,
  logbook,
  onSaved,
}: {
  meetupId: string;
  session: MemberSession;
  logbook: Logbook | null;
  onSaved: (book: Logbook) => void;
}) {
  const [content, setContent] = useState(logbook?.content || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const dirty = content !== (logbook?.content || '');
  // 새로고침·탭 닫기 시 미제출 입력이 있음을 알림. SPA 내부 이동은 이 이벤트 대상 아님
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  // 현재 BE는 취소된 세션만 제출을 막음. 회차별 작성 기간은 아직 미제공
  if (session.status === 'CANCELLED')
    return (
      <div>
        <Notice>취소된 세션에는 로그북을 제출하거나 수정할 수 없습니다.</Notice>
        <div className={styles.content}>{logbook?.content}</div>
      </div>
    );
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!content.trim() || submitting) return;
        setSubmitting(true);
        setError('');
        try {
          // 최초 제출과 수정은 동일한 PUT API 사용. 성공한 서버 응답만 화면에 반영
          const book = await documentRequest<Logbook>(
            `${logbookPath(meetupId, String(session.session_id))}/me`,
            { method: 'PUT', body: JSON.stringify({ content: content.trim() }) },
          );
          setContent(book.content || '');
          onSaved(book);
        } catch (error) {
          setError(error instanceof Error ? error.message : '제출에 실패했습니다.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label htmlFor={id}>나의 독서 기록</label>
      <TextArea
        id={id}
        rows={10}
        value={content}
        required
        disabled={submitting}
        onChange={(event) => setContent(event.target.value)}
        placeholder="인상 깊었던 문장과 나누고 싶은 생각을 적어주세요."
      />
      <p className={styles.meta}>
        {content.length.toLocaleString()}자 · 제출 후에도 수정할 수 있습니다.
      </p>
      {error && <Notice>{error}</Notice>}
      <Button type="submit" disabled={submitting || !content.trim()}>
        {submitting ? '제출 중…' : logbook ? '수정하여 다시 제출' : '로그북 제출'}
      </Button>
    </form>
  );
}
